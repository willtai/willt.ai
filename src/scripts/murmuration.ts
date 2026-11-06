/**
 * Murmuration: a starling flock over a dusk sky, painted on two fixed canvases.
 *
 * Simulation: 3D boids. Separation keeps a minimum spacing; alignment and
 * cohesion use the 7 nearest neighbours (topological, as measured in real
 * starling flocks). Each flock follows a slowly wandering attractor and swirls
 * around it; birds occasionally switch flocks, so flocks split and merge.
 * A falcon dives through the biggest flock now and then, the pointer acts as
 * a predator, and a click startles birds outward.
 *
 * Rendering: perspective projection. Each bird is a tiny 3D model (body plus
 * two jointed wings) oriented along its velocity and banked into turns, so it
 * flaps as a V side-on and shows its full span head-on. Birds are batched into
 * one path per depth bucket; far buckets fade into the sky haze.
 *
 * Scroll drives the time of day (dusk to blue hour). At the bottom of the page
 * the flock roosts in the reeds; scrolling back up makes it lift off again.
 */

export type Sky = "dusk" | "bluehour";

export interface FlockOptions {
  sky: Sky;
  /** Number of birds. 0 means auto, scaled to the viewport area. */
  birds: number;
  /** Minimum distance between neighbours, in px at mid depth. */
  spacing: number;
  /** Number of separate flocks (1 to 5). */
  flocks: number;
  /** Whether a falcon periodically dives through the flock. */
  falcon: boolean;
}

export interface FlockHandle {
  set(next: Partial<FlockOptions>): void;
  stop(): void;
}

type Vec3 = [number, number, number];

interface SkyKeyHex {
  stops: string[];
  sun: string;
  sunA: number;
  sunY: number;
  ink: string;
  haze: string;
  stars: number;
  cloudA: number;
}

interface SkyKey {
  stops: Vec3[];
  sun: Vec3;
  sunA: number;
  sunY: number;
  ink: Vec3;
  haze: Vec3;
  stars: number;
  cloudA: number;
}

interface Group {
  w: number[];
  o: number[];
  spin: Vec3;
  sgn: number;
  ax: number;
  ay: number;
  az: number;
  n: number;
  cx: number;
  cy: number;
  cz: number;
}

interface Falcon {
  on: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ph: number;
  t: number;
  next: number;
  g: number;
  passing: boolean;
}

const DEFAULTS: FlockOptions = { sky: "dusk", birds: 0, spacing: 24, flocks: 3, falcon: true };

const hex = (h: string): Vec3 => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const rgba = (c: Vec3, a = 1): string => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const prep = (o: SkyKeyHex): SkyKey => ({
  stops: o.stops.map(hex),
  sun: hex(o.sun),
  sunA: o.sunA,
  sunY: o.sunY,
  ink: hex(o.ink),
  haze: hex(o.haze),
  stars: o.stars,
  cloudA: o.cloudA,
});

/** Two keyframes per sky: top of the page (0) and bottom of the page (1). */
const PALETTES: Record<Sky, [SkyKey, SkyKey]> = {
  dusk: [
    prep({ stops: ["#5d6b88", "#a395ab", "#dcae9f", "#f1c899", "#f7dcb4"], sun: "#ffe4b0", sunA: 0.9, sunY: 0.86, ink: "#1c1826", haze: "#b7a3ad", stars: 0, cloudA: 0.5 }),
    prep({ stops: ["#2b3150", "#5a5675", "#9b7387", "#d88f6f", "#e7a47b"], sun: "#f6a56e", sunA: 0.55, sunY: 1.0, ink: "#17131f", haze: "#6d6079", stars: 0.2, cloudA: 0.3 }),
  ],
  bluehour: [
    prep({ stops: ["#1b2140", "#363b5e", "#5f5174", "#8d5f66", "#b97a6a"], sun: "#ee9a6a", sunA: 0.45, sunY: 0.98, ink: "#0c0a13", haze: "#4a4462", stars: 0.4, cloudA: 0.22 }),
    prep({ stops: ["#0d1126", "#1d2140", "#3a3452", "#6e4b5b", "#8e5f5d"], sun: "#c46a55", sunA: 0.28, sunY: 1.08, ink: "#08070d", haze: "#2a2740", stars: 0.95, cloudA: 0.1 }),
  ],
};
const STOPS = [0, 0.42, 0.66, 0.86, 1];

// World: camera at the origin looking down +z; screen = centre + xy * F / z.
const F = 900;
const ZMIN = 600;
const ZMAX = 1900;
const ZFRONT = 760; // birds nearer than this draw in front of the hero text
const MAXN = 1500;
const KN = 7; // topological neighbours
const NB = 6; // depth buckets

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const x = c.getContext("2d");
  if (!x) throw new Error("2D canvas is unavailable");
  return x;
}

export function startMurmuration(
  back: HTMLCanvasElement,
  front: HTMLCanvasElement,
  init: Partial<FlockOptions> = {}
): FlockHandle {
  const doc = back.ownerDocument;
  const win = doc.defaultView ?? window;
  const reduce = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bx = ctx2d(back);
  const fx = ctx2d(front);
  let P: FlockOptions = { ...DEFAULTS, ...init };

  let W = 1;
  let H = 1;
  let S = 1; // height the sky gradient spans (capped so tall viewports keep a real sky)
  let dpr = 1;
  let RH = 60; // reed height
  let U = 1; // scale factor for speeds and radii

  const px = new Float32Array(MAXN), py = new Float32Array(MAXN), pz = new Float32Array(MAXN);
  const vx = new Float32Array(MAXN), vy = new Float32Array(MAXN), vz = new Float32Array(MAXN);
  const ax = new Float32Array(MAXN), ay = new Float32Array(MAXN), az = new Float32Array(MAXN);
  const ph = new Float32Array(MAXN), fa = new Float32Array(MAXN), fr = new Float32Array(MAXN);
  const sd = new Float32Array(MAXN), bo = new Float32Array(MAXN), sz = new Float32Array(MAXN), pu = new Float32Array(MAXN);
  const gp = new Uint8Array(MAXN), pr = new Uint8Array(MAXN);
  const SX = new Float32Array(MAXN), SY = new Float32Array(MAXN), SL = new Float32Array(MAXN);
  const BF = new Float32Array(MAXN * 6), TB = new Float32Array(6);
  const BK = new Int8Array(MAXN), FR = new Uint8Array(MAXN);
  const act = new Int32Array(MAXN), order = new Int32Array(MAXN), cellOf = new Int32Array(MAXN);
  let cellStart = new Int32Array(1024);
  let cellCur = new Int32Array(1024);
  const kd = new Float32Array(KN), kj = new Int32Array(KN);

  let N = 0;
  let t = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let booted = false;
  let mx = -1e5, my = -1e5, mt = -100;
  let pSm = 0;
  let roost = false;
  let relAcc = 0, relDur = 2.2, relDelay = 0.35;
  let reeds: HTMLCanvasElement | null = null;
  let clouds: HTMLCanvasElement | null = null;
  let stars: HTMLCanvasElement | null = null;
  let skyC: HTMLCanvasElement | null = null;
  let skyK = -1;
  let skyName = "";
  const groups: Group[] = [];
  const fal: Falcon = { on: false, x: 0, y: 0, z: F, vx: 0, vy: 0, vz: 0, ph: 0, t: 0, next: 9, g: 0, passing: false };

  const rnd = Math.random;
  const seeded = (seed: number) => (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const pal = (): [SkyKey, SkyKey] => PALETTES[P.sky];

  const makeGroups = (): void => {
    const G = Math.max(1, Math.min(5, Math.round(P.flocks) || 3));
    groups.length = 0;
    for (let g = 0; g < G; g++) {
      const s0 = rnd() * 2 - 1, s1 = rnd() * 2 - 1, s2 = rnd() * 2 - 1;
      const l = Math.hypot(s0, s1, s2) || 1;
      groups.push({
        w: [0.05 + rnd() * 0.05, 0.11 + rnd() * 0.08, 0.04 + rnd() * 0.05, 0.13 + rnd() * 0.08, 0.03 + rnd() * 0.04],
        o: [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3, rnd() * 6.3, rnd() * 6.3],
        spin: [s0 / l, s1 / l, s2 / l],
        sgn: rnd() < 0.5 ? -1 : 1,
        ax: 0, ay: 0, az: F, n: 0, cx: 0, cy: 0, cz: F,
      });
    }
    for (let i = 0; i < N; i++) gp[i] = i % G;
  };

  const updAttr = (): void => {
    const G = groups.length;
    const tall = H > 1400;
    for (let g = 0; g < G; g++) {
      const A = groups[g], w = A.w, o = A.o;
      let u = 0.5 + 0.34 * Math.sin(t * w[0] + o[0]) + 0.1 * Math.sin(t * w[1] + o[1]);
      let v = (tall ? 0.48 : 0.34) + (tall ? 0.34 : 0.15) * Math.sin(t * w[2] + o[2]) + 0.05 * Math.sin(t * w[3] + o[3]);
      let z = F * (1.05 + 0.3 * Math.sin(t * w[4] + o[4]));
      if (roost) {
        u = 0.12 + 0.76 * ((g + 0.5) / G);
        v = (H - RH * 0.2) / H;
        z = F * 1.1;
      }
      A.ax = ((u * W - W / 2) * z) / F;
      A.ay = ((v * H - H / 2) * z) / F;
      A.az = z;
    }
  };

  const spawn = (i: number, perch: boolean): void => {
    const G = groups.length, g = i % G, A = groups[g];
    gp[i] = g;
    sd[i] = rnd() * 1000;
    fr[i] = 6 + rnd() * 2.5;
    ph[i] = rnd() * 6.283;
    fa[i] = 0.6;
    bo[i] = 0;
    sz[i] = 0.82 + rnd() * 0.36;
    pu[i] = rnd() * W;
    if (perch) {
      pr[i] = 1;
      return;
    }
    pr[i] = 0;
    pz[i] = Math.max(ZMIN + 60, Math.min(ZMAX - 60, A.az + (rnd() - 0.5) * 320));
    px[i] = A.ax + (rnd() - 0.5) * 320 * U;
    py[i] = A.ay + (rnd() - 0.5) * 200 * U;
    const a = rnd() * 6.283;
    vx[i] = Math.cos(a) * 130 * U;
    vy[i] = Math.sin(a) * 50 * U;
    vz[i] = (rnd() - 0.5) * 70;
  };

  const setCount = (): void => {
    const auto = Math.round(Math.max(120, Math.min(650, (W * Math.min(H, 1100)) / 2000)));
    const want = Math.max(10, Math.min(MAXN, P.birds > 0 ? Math.round(P.birds) : auto));
    while (N < want) {
      spawn(N, !booted && !reduce && H <= 1400);
      N++;
    }
    if (N > want) N = want;
  };

  const buildReeds = (): void => {
    const c = reeds ?? doc.createElement("canvas");
    reeds = c;
    c.width = Math.max(1, Math.round(W * dpr));
    c.height = Math.max(1, Math.round(RH * dpr));
    const g = ctx2d(c);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, RH);
    const ink = pal()[0].ink, r = seeded(7);
    g.fillStyle = rgba(ink);
    g.strokeStyle = rgba(ink);
    g.lineCap = "round";
    const n = Math.round(W / 2.6);
    for (let i = 0; i < n; i++) {
      const x = r() * W, h = RH * (0.3 + 0.7 * Math.pow(r(), 0.6)), lean = (r() - 0.45) * h * 0.3;
      g.lineWidth = 0.6 + r() * 1.1;
      g.beginPath();
      g.moveTo(x, RH + 2);
      g.quadraticCurveTo(x + lean * 0.2, RH - h * 0.55, x + lean, RH - h);
      g.stroke();
      if (r() < 0.4) {
        // drooping plume
        const pl = h * (0.12 + r() * 0.1), pw = 0.9 + r() * 0.9;
        g.save();
        g.translate(x + lean, RH - h);
        g.rotate(Math.atan2(lean, h) + (lean >= 0 ? 1 : -1) * (0.3 + r() * 0.5));
        g.beginPath();
        g.ellipse(0, -pl * 0.42, pw, pl * 0.58, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      if (r() < 0.3) {
        // leaf blade
        const k = 0.25 + r() * 0.35, ly = RH - h * k, lx = x + lean * k * k, dir = r() < 0.5 ? -1 : 1, len = h * (0.25 + r() * 0.25);
        g.lineWidth = 1 + r();
        g.beginPath();
        g.moveTo(lx, ly);
        g.quadraticCurveTo(lx + dir * len * 0.6, ly - len * 0.35, lx + dir * len, ly + len * 0.15);
        g.stroke();
      }
    }
    const gr = g.createLinearGradient(0, RH * 0.5, 0, RH);
    gr.addColorStop(0, rgba(ink, 0));
    gr.addColorStop(1, rgba(ink, 1));
    g.fillStyle = gr;
    g.fillRect(0, RH * 0.5, W, RH * 0.5);
  };

  const buildClouds = (): void => {
    const c = clouds ?? doc.createElement("canvas");
    clouds = c;
    const k = dpr * 0.5;
    c.width = Math.max(1, Math.round(W * k));
    c.height = Math.max(1, Math.round(S * k));
    const g = ctx2d(c), r = seeded(11);
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, W, S);
    const base = Math.max(W, 1000);
    for (let i = 0; i < 5; i++) {
      const cx = r() * W, cy = S * (0.3 + r() * 0.5), len = base * (0.25 + r() * 0.35), th = S * (0.02 + r() * 0.03);
      for (let j = 0; j < 7; j++) {
        const bxp = cx + (j / 6 - 0.5) * len, byp = cy + (r() - 0.5) * th * 0.8, ry = th * (0.6 + r() * 0.6), rx = ry * (4 + r() * 3);
        // draw each puff three times so the band wraps seamlessly while drifting
        for (const wx of [bxp - W, bxp, bxp + W]) {
          if (wx + rx < 0 || wx - rx > W) continue;
          g.save();
          g.translate(wx, byp);
          g.scale(rx / ry, 1);
          const rg = g.createRadialGradient(0, 0, 0, 0, 0, ry);
          rg.addColorStop(0, "rgba(255,241,228,0.32)");
          rg.addColorStop(0.6, "rgba(255,241,228,0.12)");
          rg.addColorStop(1, "rgba(255,241,228,0)");
          g.fillStyle = rg;
          g.beginPath();
          g.arc(0, 0, ry, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }
      }
    }
  };

  const buildStars = (): void => {
    const c = stars ?? doc.createElement("canvas");
    stars = c;
    const h = S * 0.6;
    c.width = Math.max(1, Math.round(W * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const g = ctx2d(c), r = seeded(3);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, h);
    const n = Math.round((W * h) / 2200);
    for (let i = 0; i < n; i++) {
      const y = Math.pow(r(), 1.4) * h, s = 0.5 + r() * 1.1;
      g.fillStyle = `rgba(255,246,236,${(0.25 + r() * 0.75) * (1 - y / h)})`;
      g.fillRect(r() * W, y, s, s);
    }
  };

  const resize = (): void => {
    W = Math.max(1, win.innerWidth);
    H = Math.max(1, win.innerHeight);
    S = Math.min(H, 1100);
    U = Math.max(0.6, Math.min(1.15, Math.sqrt(W * S) / 1100));
    RH = Math.max(52, Math.min(110, S * 0.1));
    dpr = Math.min(win.devicePixelRatio || 1, 2);
    const cap = 5.5e6;
    if (W * H * dpr * dpr > cap) dpr = Math.max(0.6, Math.sqrt(cap / (W * H)));
    for (const cv of [back, front]) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    bx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildReeds();
    buildClouds();
    buildStars();
    updAttr();
    setCount();
  };

  /** Lift perched birds out of the reeds a few at a time. */
  const release = (dt: number): void => {
    if (roost || reduce) return;
    if (relDelay > 0) {
      relDelay -= dt;
      return;
    }
    relAcc += (N * dt) / relDur;
    let k = Math.floor(relAcc);
    if (k <= 0) return;
    relAcc -= k;
    for (let i = 0; i < N && k > 0; i++) {
      if (!pr[i]) continue;
      pr[i] = 0;
      k--;
      const z = F * (0.85 + rnd() * 0.55), u = Math.max(0, Math.min(W, pu[i]));
      pz[i] = z;
      px[i] = ((u - W / 2) * z) / F;
      py[i] = ((H - RH * 0.45 - H / 2) * z) / F;
      vx[i] = (rnd() - 0.5) * 100 * U;
      vy[i] = -(170 + rnd() * 120) * U;
      vz[i] = (rnd() - 0.5) * 80;
      bo[i] = 1;
      fa[i] = 1;
    }
  };

  const startle = (x: number, y: number, r0: number): void => {
    const R = r0 * U;
    for (let i = 0; i < N; i++) {
      if (pr[i]) continue;
      const iz = F / pz[i], sx = W / 2 + px[i] * iz, sy = H / 2 + py[i] * iz;
      const dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy);
      if (d > R || d < 0.01) continue;
      const f = 1 - d / R, k = 320 * U * f;
      vx[i] += (dx / d) * k;
      vy[i] += (dy / d) * k - 50 * f;
      vz[i] += 120 * f;
      if (bo[i] < f) bo[i] = f;
    }
  };

  const updFalcon = (dt: number): void => {
    if (!P.falcon || reduce || roost) {
      fal.on = false;
      return;
    }
    const VF = 440 * U;
    if (!fal.on) {
      fal.next -= dt;
      if (fal.next > 0) return;
      let g = 0, best = -1;
      for (let k = 0; k < groups.length; k++) {
        if (groups[k].n > best) {
          best = groups[k].n;
          g = k;
        }
      }
      if (best < 12) {
        fal.next = 4;
        return;
      }
      const T = groups[g];
      fal.g = g;
      fal.on = true;
      fal.t = 0;
      fal.passing = false;
      const z = Math.max(ZMIN + 60, Math.min(ZMAX - 120, T.cz));
      const su = rnd() < 0.5 ? -0.08 * W : 1.08 * W, sv = Math.min(H, 1000) * (0.04 + rnd() * 0.3);
      fal.z = z;
      fal.x = ((su - W / 2) * z) / F;
      fal.y = ((sv - H / 2) * z) / F;
      const dx = T.cx - fal.x, dy = T.cy - fal.y, dz = T.cz - fal.z, d = Math.hypot(dx, dy, dz) || 1;
      fal.vx = (dx / d) * VF;
      fal.vy = (dy / d) * VF;
      fal.vz = (dz / d) * VF;
      return;
    }
    fal.t += dt;
    const T = groups[fal.g] ?? groups[0];
    const dx = T.cx - fal.x, dy = T.cy - fal.y, dz = T.cz - fal.z, d = Math.hypot(dx, dy, dz) || 1;
    if (!fal.passing && (d < 50 * U || fal.t > 4)) fal.passing = true;
    if (!fal.passing) {
      let qx = ((dx / d) * VF - fal.vx) * 2.6, qy = ((dy / d) * VF - fal.vy) * 2.6, qz = ((dz / d) * VF - fal.vz) * 2.6;
      const qm = Math.hypot(qx, qy, qz), cap = 1200 * U;
      if (qm > cap) {
        qx *= cap / qm;
        qy *= cap / qm;
        qz *= cap / qm;
      }
      fal.vx += qx * dt;
      fal.vy += qy * dt;
      fal.vz += qz * dt;
    }
    const sp = Math.hypot(fal.vx, fal.vy, fal.vz) || 1, want = VF * (fal.passing ? 1.1 : 1);
    fal.vx *= want / sp;
    fal.vy *= want / sp;
    fal.vz *= want / sp;
    fal.x += fal.vx * dt;
    fal.y += fal.vy * dt;
    fal.z = Math.max(ZMIN, Math.min(ZMAX, fal.z + fal.vz * dt));
    fal.ph += dt * 6.283 * (fal.passing ? 1.6 : 3.2);
    const iz = F / fal.z, sx = W / 2 + fal.x * iz, sy = H / 2 + fal.y * iz;
    if ((fal.passing && (sx < -0.3 * W || sx > 1.3 * W || sy < -0.4 * H || sy > 1.4 * H)) || fal.t > 12) {
      fal.on = false;
      fal.next = 11 + rnd() * 13;
    }
  };

  const step = (dt: number): void => {
    const SEP = Math.max(4, P.spacing || 24) * U, SEP2 = SEP * SEP;
    const NR = Math.max(SEP * 2.4, 64 * U), NR2 = NR * NR;
    const V0 = 135 * U, VMIN = 85 * U, VMAX = 230 * U, AMAX = 1500 * U;
    const G = groups.length;
    for (const A of groups) {
      A.n = 0;
      A.cx = 0;
      A.cy = 0;
      A.cz = 0;
    }
    let na = 0;
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) {
      if (pr[i]) continue;
      act[na++] = i;
      if (px[i] < x0) x0 = px[i];
      if (px[i] > x1) x1 = px[i];
      if (py[i] < y0) y0 = py[i];
      if (py[i] > y1) y1 = py[i];
      if (pz[i] < z0) z0 = pz[i];
      if (pz[i] > z1) z1 = pz[i];
      const A = groups[gp[i] % G];
      A.n++;
      A.cx += px[i];
      A.cy += py[i];
      A.cz += pz[i];
    }
    for (const A of groups) {
      if (A.n) {
        A.cx /= A.n;
        A.cy /= A.n;
        A.cz /= A.n;
      } else {
        A.cx = A.ax;
        A.cy = A.ay;
        A.cz = A.az;
      }
    }
    if (!na) return;

    // uniform grid via counting sort
    let cs = NR, nx = 0, ny = 0, nz = 0;
    for (;;) {
      nx = Math.floor((x1 - x0) / cs) + 1;
      ny = Math.floor((y1 - y0) / cs) + 1;
      nz = Math.floor((z1 - z0) / cs) + 1;
      if (nx * ny * nz <= 120000) break;
      cs *= 1.5;
    }
    const cells = nx * ny * nz;
    if (cellStart.length < cells + 1) {
      cellStart = new Int32Array(cells + 1);
      cellCur = new Int32Array(cells + 1);
    }
    cellCur.fill(0, 0, cells + 1);
    for (let a = 0; a < na; a++) {
      const i = act[a];
      const c = (((px[i] - x0) / cs) | 0) + nx * ((((py[i] - y0) / cs) | 0) + ny * (((pz[i] - z0) / cs) | 0));
      cellOf[i] = c;
      cellCur[c]++;
    }
    let s = 0;
    for (let c = 0; c < cells; c++) {
      const k = cellCur[c];
      cellStart[c] = s;
      cellCur[c] = s;
      s += k;
    }
    cellStart[cells] = s;
    for (let a = 0; a < na; a++) {
      const i = act[a];
      order[cellCur[cellOf[i]]++] = i;
    }

    const curOn = t - mt < 2.5, RC = 130 * U, RC2 = RC * RC;
    const RF = 170 * U, RF2 = RF * RF;
    for (let a = 0; a < na; a++) {
      const i = act[a], xi = px[i], yi = py[i], zi = pz[i];
      const ci = ((xi - x0) / cs) | 0, cj = ((yi - y0) / cs) | 0, ck = ((zi - z0) / cs) | 0;
      let sepx = 0, sepy = 0, sepz = 0, kc = 0;
      for (let dz = -1; dz <= 1; dz++) {
        const zz = ck + dz;
        if (zz < 0 || zz >= nz) continue;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = cj + dy;
          if (yy < 0 || yy >= ny) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = ci + dx;
            if (xx < 0 || xx >= nx) continue;
            const c = xx + nx * (yy + ny * zz);
            for (let q = cellStart[c], e = cellStart[c + 1]; q < e; q++) {
              const j = order[q];
              if (j === i) continue;
              const ex = px[j] - xi, ey = py[j] - yi, ez = pz[j] - zi, d2 = ex * ex + ey * ey + ez * ez;
              if (d2 > NR2) continue;
              if (d2 < SEP2) {
                const d = Math.sqrt(d2) + 0.001, f = (1 - d / SEP) / d;
                sepx -= ex * f;
                sepy -= ey * f;
                sepz -= ez * f;
              }
              // keep the KN nearest neighbours (insertion into a tiny sorted list)
              if (kc < KN || d2 < kd[KN - 1]) {
                let m = kc < KN ? kc++ : KN - 1;
                while (m > 0 && kd[m - 1] > d2) {
                  kd[m] = kd[m - 1];
                  kj[m] = kj[m - 1];
                  m--;
                }
                kd[m] = d2;
                kj[m] = j;
              }
            }
          }
        }
      }
      const KS = 720 * U;
      let qx = sepx * KS, qy = sepy * KS, qz = sepz * KS;
      if (kc) {
        let mvx = 0, mvy = 0, mvz = 0, mpx = 0, mpy = 0, mpz = 0;
        for (let m = 0; m < kc; m++) {
          const j = kj[m];
          mvx += vx[j];
          mvy += vy[j];
          mvz += vz[j];
          mpx += px[j];
          mpy += py[j];
          mpz += pz[j];
        }
        const inv = 1 / kc;
        qx += (mvx * inv - vx[i]) * 2.2;
        qy += (mvy * inv - vy[i]) * 2.2;
        qz += (mvz * inv - vz[i]) * 2.2;
        qx += (mpx * inv - xi) * 1.1;
        qy += (mpy * inv - yi) * 1.1;
        qz += (mpz * inv - zi) * 1.1;
      }
      // pull toward the flock's wandering centre, plus a slow swirl around it
      const A = groups[gp[i] % G];
      const tx = A.ax - xi, ty = A.ay - yi, tz = A.az - zi, td = Math.hypot(tx, ty, tz) || 1;
      const RA = (45 + 5.5 * Math.sqrt(Math.max(1, A.n))) * U, ex = td - RA;
      if (ex > 0) {
        const f = Math.min(ex * 0.6, 210 * U) / td;
        qx += tx * f;
        qy += ty * f;
        qz += tz * f;
      }
      const sw = (42 * U * A.sgn) / td, sp0 = A.spin;
      qx += (sp0[1] * -tz - sp0[2] * -ty) * sw;
      qy += (sp0[2] * -tx - sp0[0] * -tz) * sw;
      qz += (sp0[0] * -ty - sp0[1] * -tx) * sw;
      // personal wander
      const sdi = sd[i];
      qx += Math.sin(t * 0.8 + sdi) * 22 * U;
      qy += Math.cos(t * 0.67 + sdi * 1.3) * 14 * U;
      qz += Math.sin(t * 0.53 + sdi * 0.7) * 30;
      // cruise speed
      const spd = Math.hypot(vx[i], vy[i], vz[i]) || 1;
      qx += (vx[i] / spd) * (V0 - spd) * 1.4;
      qy += (vy[i] / spd) * (V0 - spd) * 1.4;
      qz += (vz[i] / spd) * (V0 - spd) * 1.4;
      // soft screen bounds
      const iz = F / zi, scx = W / 2 + xi * iz, scy = H / 2 + yi * iz, mg = 0.04 * W;
      const bxv = scx < -mg ? -mg - scx : scx > W + mg ? W + mg - scx : 0;
      const bot = roost ? H + 40 : H - RH * 0.9;
      const byv = scy < -0.05 * S ? -0.05 * S - scy : scy > bot ? bot - scy : 0;
      qx += (bxv / iz) * 3.2;
      qy += (byv / iz) * 3.2;
      if (zi < ZMIN + 90) qz += (ZMIN + 90 - zi) * 3;
      else if (zi > ZMAX - 90) qz -= (zi - ZMAX + 90) * 3;
      // falcon
      if (fal.on) {
        const fx0 = xi - fal.x, fy0 = yi - fal.y, fz0 = zi - fal.z, fd2 = fx0 * fx0 + fy0 * fy0 + fz0 * fz0;
        if (fd2 < RF2) {
          const fd = Math.sqrt(fd2) + 0.01, f = 1 - fd / RF, k = (2600 * U * f) / fd;
          qx += fx0 * k;
          qy += fy0 * k;
          qz += fz0 * k;
          if (bo[i] < f) bo[i] = f;
        }
      }
      // the pointer acts as a predator in screen space
      if (curOn) {
        const ux = scx - mx, uy = scy - my, ud2 = ux * ux + uy * uy;
        if (ud2 < RC2) {
          const ud = Math.sqrt(ud2) + 0.01, f = 1 - ud / RC, k = (2000 * U * f) / ud;
          qx += ux * k;
          qy += uy * k;
          qz += 380 * f;
          if (bo[i] < f * 0.8) bo[i] = f * 0.8;
        }
      }
      const qm = Math.hypot(qx, qy, qz);
      if (qm > AMAX) {
        const k = AMAX / qm;
        qx *= k;
        qy *= k;
        qz *= k;
      }
      ax[i] = qx;
      ay[i] = qy;
      az[i] = qz;
    }

    for (let a = 0; a < na; a++) {
      const i = act[a];
      vx[i] += ax[i] * dt;
      vy[i] += ay[i] * dt;
      vz[i] += az[i] * dt;
      let sp = Math.hypot(vx[i], vy[i], vz[i]) || 1;
      const hi = VMAX * (1 + bo[i] * 0.7);
      if (sp > hi) {
        const k = hi / sp;
        vx[i] *= k;
        vy[i] *= k;
        vz[i] *= k;
        sp = hi;
      } else if (sp < VMIN) {
        const k = VMIN / sp;
        vx[i] *= k;
        vy[i] *= k;
        vz[i] *= k;
        sp = VMIN;
      }
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      pz[i] = Math.max(ZMIN - 40, Math.min(ZMAX + 40, pz[i] + vz[i] * dt));
      // flap in bursts and glide between; beat harder when climbing or fleeing
      const climb = Math.max(0, -vy[i] / sp);
      const burst = Math.sin(t * 0.9 + sd[i]) > 0.15 ? 1 : 0;
      const am = Math.hypot(ax[i], ay[i], az[i]);
      const target = Math.min(1, 0.16 + 0.5 * burst + 0.7 * climb + am / (1400 * U) + bo[i]);
      fa[i] += (target - fa[i]) * Math.min(1, dt * 5);
      ph[i] += dt * 6.283 * fr[i] * (0.3 + 0.7 * fa[i]) * (1 + bo[i] * 0.6);
      bo[i] *= Math.exp(-dt * 1.6);
      if (roost) {
        const iz = F / pz[i], scy = H / 2 + py[i] * iz;
        if (scy > H - RH * 0.38 && vy[i] > 0) {
          pr[i] = 1;
          pu[i] = W / 2 + px[i] * iz;
        }
      }
    }

    // birds occasionally swap flocks, which makes flocks split and merge
    if (G > 1 && rnd() < dt * 0.12) {
      const k = Math.max(1, Math.round(na * 0.03));
      for (let m = 0; m < k; m++) {
        const i = act[(rnd() * na) | 0];
        gp[i] = (rnd() * G) | 0;
      }
    }
  };

  // Screen-space projection of a bird's forward / right / up axes, banked into
  // turns, with a first-order perspective correction for birds off-centre.
  const basis = (out: Float32Array, o: number, v0: number, v1: number, v2: number, a0: number, a1: number, a2: number, sx: number, sy: number): void => {
    const vl = Math.hypot(v0, v1, v2) || 1, f0 = v0 / vl, f1 = v1 / vl, f2 = v2 / vl;
    let r0 = f2 - 0.25 * f1, r1 = 0.25 * f0, r2 = -f0;
    const rl = Math.hypot(r0, r1, r2) || 1;
    r0 /= rl;
    r1 /= rl;
    r2 /= rl;
    let u0 = r1 * f2 - r2 * f1, u1 = r2 * f0 - r0 * f2, u2 = r0 * f1 - r1 * f0;
    const bank = Math.max(-0.7, Math.min(0.7, (a0 * r0 + a1 * r1 + a2 * r2) / (1100 * U)));
    const cb = Math.cos(bank), sb = Math.sin(bank);
    const q0 = r0 * cb + u0 * sb, q1 = r1 * cb + u1 * sb, q2 = r2 * cb + u2 * sb;
    u0 = u0 * cb - r0 * sb;
    u1 = u1 * cb - r1 * sb;
    u2 = u2 * cb - r2 * sb;
    const kx = (sx - W / 2) / F, ky = (sy - H / 2) / F;
    out[o] = f0 - f2 * kx;
    out[o + 1] = f1 - f2 * ky;
    out[o + 2] = q0 - q2 * kx;
    out[o + 3] = q1 - q2 * ky;
    out[o + 4] = u0 - u2 * kx;
    out[o + 5] = u1 - u2 * ky;
  };

  let cx0 = 0, cy0 = 0, cL = 1, cB: Float32Array = BF, cO = 0;
  const pt = (c: CanvasRenderingContext2D, a: number, b: number, u: number, move = false): void => {
    const X = cx0 + (cB[cO] * a + cB[cO + 2] * b + cB[cO + 4] * u) * cL;
    const Y = cy0 + (cB[cO + 1] * a + cB[cO + 3] * b + cB[cO + 5] * u) * cL;
    if (move) c.moveTo(X, Y);
    else c.lineTo(X, Y);
  };

  // Bird model in units of wingspan, axes (forward, right, up).
  const addBird = (c: CanvasRenderingContext2D, x: number, y: number, L: number, B: Float32Array, o: number, p: number, a: number, hawk: boolean): void => {
    cx0 = x;
    cy0 = y;
    cL = L;
    cB = B;
    cO = o;
    const hl = hawk ? 0.24 : 0.19, tl = hawk ? -0.42 : -0.24, tw = hawk ? 0.04 : 0.055;
    // body, horizontal and vertical cross-sections
    pt(c, hl, 0, 0, true);
    pt(c, 0.05, 0.05, 0);
    pt(c, tl, tw, 0);
    pt(c, tl, -tw, 0);
    pt(c, 0.05, -0.05, 0);
    c.closePath();
    pt(c, hl, 0, 0, true);
    pt(c, 0.03, 0, 0.045);
    pt(c, tl, 0, 0.012);
    pt(c, 0, 0, -0.045);
    c.closePath();
    // wings: shoulder angle th, wrist bends further (th2)
    const th = a * 0.95 * Math.sin(p), th2 = th * 1.45 + a * 0.1;
    const c1 = Math.cos(th), s1 = Math.sin(th), c2 = Math.cos(th2), s2 = Math.sin(th2);
    const reach = hawk ? 0.27 : 0.25, sweep = hawk ? -0.3 : -0.17, outer = 0.25;
    for (let s = 1; s >= -1; s -= 2) {
      pt(c, 0.08, s * c1 * 0.04, s1 * 0.04, true);
      pt(c, 0.05, s * c1 * reach, s1 * reach);
      pt(c, 0.05 + sweep, s * (c1 * reach + c2 * outer), s1 * reach + s2 * outer);
      pt(c, -0.07, s * c1 * reach * 0.78, s1 * reach * 0.78);
      pt(c, -0.1, s * c1 * 0.04, s1 * 0.04);
      c.closePath();
    }
  };

  // The sky only changes with scroll, so paint it once per change and blit it.
  const paintSky = (k: number): HTMLCanvasElement => {
    if (skyC && skyC.width === back.width && skyC.height === back.height && skyName === P.sky && Math.abs(k - skyK) < 0.004) return skyC;
    const sc = skyC ?? doc.createElement("canvas");
    skyC = sc;
    if (sc.width !== back.width || sc.height !== back.height) {
      sc.width = back.width;
      sc.height = back.height;
    }
    skyK = k;
    skyName = P.sky;
    const c = ctx2d(sc), [A0, A1] = pal();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, S);
    for (let i = 0; i < 5; i++) g.addColorStop(STOPS[i], rgba(mix(A0.stops[i], A1.stops[i], k)));
    c.globalAlpha = 1;
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const st = A0.stars + (A1.stars - A0.stars) * k;
    if (st > 0.02 && stars) {
      c.globalAlpha = Math.min(1, st);
      c.drawImage(stars, 0, 0, W, S * 0.6);
      c.globalAlpha = 1;
    }
    const sun = mix(A0.sun, A1.sun, k), sa = A0.sunA + (A1.sunA - A0.sunA) * k;
    const sy0 = S * (A0.sunY + (A1.sunY - A0.sunY) * k), sx0 = W * 0.74;
    const R = Math.max(W * 0.6, S * 0.9), rg = c.createRadialGradient(sx0, sy0, 0, sx0, sy0, R);
    rg.addColorStop(0, rgba(sun, sa));
    rg.addColorStop(0.12, rgba(sun, sa * 0.6));
    rg.addColorStop(0.45, rgba(sun, sa * 0.16));
    rg.addColorStop(1, rgba(sun, 0));
    c.fillStyle = rg;
    c.fillRect(0, 0, W, H);
    return sc;
  };

  const render = (k: number): void => {
    const [A0, A1] = pal();
    bx.globalAlpha = 1;
    bx.drawImage(paintSky(k), 0, 0, W, H);
    const ca = A0.cloudA + (A1.cloudA - A0.cloudA) * k;
    if (ca > 0.01 && clouds) {
      const off = (t * 3) % W;
      bx.globalAlpha = ca;
      bx.drawImage(clouds, -off, 0, W, S);
      bx.drawImage(clouds, W - off, 0, W, S);
      bx.globalAlpha = 1;
    }

    // project birds
    const ink = mix(A0.ink, A1.ink, k), haze = mix(A0.haze, A1.haze, k);
    const span0 = 12 * Math.max(0.74, Math.min(1.1, W / 1200));
    const frontOn = win.scrollY < Math.min(H, 1000) * 0.55;
    let cnt = 0;
    for (let i = 0; i < N; i++) {
      if (pr[i]) continue;
      const iz = F / pz[i], sx = W / 2 + px[i] * iz, sy = H / 2 + py[i] * iz;
      if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
      SX[cnt] = sx;
      SY[cnt] = sy;
      SL[cnt] = span0 * iz * sz[i];
      basis(BF, cnt * 6, vx[i], vy[i], vz[i], ax[i], ay[i], az[i], sx, sy);
      BK[cnt] = Math.max(0, Math.min(NB - 1, (((pz[i] - ZMIN) / (ZMAX - ZMIN)) * NB) | 0));
      FR[cnt] = frontOn && pz[i] < ZFRONT ? 1 : 0;
      act[cnt] = i;
      cnt++;
    }
    fx.clearRect(0, 0, W, H);
    for (let layer = 0; layer < 2; layer++) {
      const c = layer ? fx : bx;
      for (let b = NB - 1; b >= 0; b--) {
        c.beginPath();
        let any = false;
        for (let m = 0; m < cnt; m++) {
          if (BK[m] !== b || FR[m] !== layer) continue;
          const i = act[m];
          addBird(c, SX[m], SY[m], SL[m], BF, m * 6, ph[i], fa[i], false);
          any = true;
        }
        if (any) {
          c.fillStyle = rgba(mix(ink, haze, (b / (NB - 1)) * 0.62), 0.93);
          c.fill();
        }
      }
    }
    if (fal.on) {
      const iz = F / fal.z, sx = W / 2 + fal.x * iz, sy = H / 2 + fal.y * iz;
      const c = frontOn && fal.z < ZFRONT ? fx : bx;
      basis(TB, 0, fal.vx, fal.vy, fal.vz, 0, 0, 0, sx, sy);
      c.beginPath();
      addBird(c, sx, sy, span0 * 2.6 * iz, TB, 0, fal.ph, fal.passing ? 0.12 : 0.75, true);
      c.fillStyle = rgba(ink, 0.96);
      c.fill();
    }
    if (reeds) bx.drawImage(reeds, 0, H - RH, W, RH);
  };

  /** Scroll position drives the time of day and the roost. Returns eased 0..1. */
  const readScroll = (dt: number): number => {
    const se = doc.scrollingElement ?? doc.documentElement;
    const maxS = se.scrollHeight - H;
    const p = maxS > 4 ? Math.max(0, Math.min(1, win.scrollY / maxS)) : 0;
    pSm += (p - pSm) * Math.min(1, dt * 2.5);
    if (!roost && maxS > 4 && p > 0.95) roost = true;
    else if (roost && p < 0.88) {
      roost = false;
      relDur = 2.6;
      relDelay = 0;
    }
    return pSm * pSm * (3 - 2 * pSm);
  };

  const frame = (now: number): void => {
    raf = 0;
    if (!running) return;
    let dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    if (dt > 0.25) dt = 1 / 60;
    dt = Math.min(dt, 1 / 30);
    t += dt;
    const k = readScroll(dt);
    updAttr();
    release(dt);
    updFalcon(dt);
    step(dt);
    render(k);
    raf = win.requestAnimationFrame(frame);
  };

  const onMove = (e: PointerEvent): void => {
    mx = e.clientX;
    my = e.clientY;
    mt = t;
  };
  const onDown = (e: PointerEvent): void => {
    mx = e.clientX;
    my = e.clientY;
    mt = t;
    if (!reduce) startle(e.clientX, e.clientY, 280);
  };
  const onTouch = (e: TouchEvent): void => {
    const p = e.touches[0];
    if (p) {
      mx = p.clientX;
      my = p.clientY;
      mt = t;
    }
  };
  const onLeave = (): void => {
    mt = -100;
  };
  let rt = 0;
  const onResize = (): void => {
    win.clearTimeout(rt);
    rt = win.setTimeout(() => {
      resize();
      if (reduce) render(0);
    }, 120);
  };
  const start = (): void => {
    if (running || reduce) return;
    running = true;
    last = 0;
    raf = win.requestAnimationFrame(frame);
  };
  const halt = (): void => {
    running = false;
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVis = (): void => {
    if (doc.hidden) halt();
    else start();
  };

  makeGroups();
  resize();
  booted = true;
  if (reduce) {
    // one still frame of the flock mid-flight
    for (let i = 0; i < 360; i++) {
      t += 1 / 60;
      updAttr();
      step(1 / 60);
    }
    render(0);
  } else {
    win.addEventListener("pointermove", onMove, { passive: true });
    win.addEventListener("pointerdown", onDown, { passive: true });
    win.addEventListener("touchmove", onTouch, { passive: true });
    doc.addEventListener("pointerleave", onLeave);
    doc.addEventListener("visibilitychange", onVis);
    start();
  }
  win.addEventListener("resize", onResize);

  return {
    set(next: Partial<FlockOptions>): void {
      const prev = P;
      P = { ...P, ...next };
      if (P.flocks !== prev.flocks) {
        makeGroups();
        updAttr();
      }
      if (P.birds !== prev.birds) setCount();
      if (P.sky !== prev.sky) buildReeds();
      if (reduce) render(0);
    },
    stop(): void {
      halt();
      win.clearTimeout(rt);
      win.removeEventListener("pointermove", onMove);
      win.removeEventListener("pointerdown", onDown);
      win.removeEventListener("touchmove", onTouch);
      win.removeEventListener("resize", onResize);
      doc.removeEventListener("pointerleave", onLeave);
      doc.removeEventListener("visibilitychange", onVis);
    },
  };
}
