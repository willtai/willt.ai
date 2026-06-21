/**
 * Murmuration — 500 glowing orbs in Reynolds boids formation.
 *
 * 3–5 independent sub-flocks with local-only rules prevent global convergence.
 * Each bird also has a slowly-rotating wander heading so alignment never
 * fully locks the group into a single ball.
 *
 * Performance:
 *   Glow: pre-rendered sprite stamped via drawImage (no per-frame gradient alloc)
 *   Core dots: single batched beginPath/fill per colour group
 *   Additive blending: overlapping glows stack, flock centre glows bright
 *
 * Palette: --color-glow #34d399 / --color-teal #0d9488 / --color-celadon #ACE1AF
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Flock layout ───────────────────────────────────────────────────────────
const N_FLOCKS = 4;   // independent sub-flocks
const COUNT    = 120; // birds per flock (480 total)

// ─── Boid tuning (calm, dreamlike) ──────────────────────────────────────────
const V_MAX    = 55;   // px/sec — slow float
const V_MIN    = 12;   // px/sec
const PERC_R   = 100;  // perception radius px
const SEP_R    = 28;   // minimum comfortable distance px
const MAX_SEP  = 260;  // separation acceleration cap px/sec²
const MAX_ALI  = 80;   // alignment acceleration cap px/sec²
const MAX_COH  = 30;   // cohesion toward own flock's centroid px/sec²
const MAX_WALL = 180;  // boundary turn force px/sec²
const MARGIN   = 130;  // px from edge where boundary force starts
// Wander: each bird has a slowly-drifting personal heading
const WANDER_R    = 18;   // radius of wander circle (strength)
const WANDER_RATE = 0.4;  // rad/sec max wander angle change

// ─── Visual ─────────────────────────────────────────────────────────────────
const SPRITE_R = 20;   // glow sprite radius px
const GLOW_A   = 0.06; // per-bird alpha (additive stacking brightens dense patches)
const DOT_R    = 1.8;  // core dot radius px
const DOT_A    = 0.65; // core dot alpha

// One glow colour per sub-flock (all from site palette, subtly varied)
// --color-glow #34d399, --color-teal #0d9488, --color-celadon #ACE1AF, emerald #50C878
const FLOCK_COLORS: [number, number, number][] = [
  [52, 211, 153],  // glow
  [13, 148, 136],  // teal
  [172, 225, 175], // celadon
  [80, 200, 120],  // emerald
];

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  flock: number;       // sub-flock index
  wanderAngle: number; // personal heading offset (radians)
}

function mkBoid(w: number, h: number, flock: number): Boid {
  const ang = Math.random() * Math.PI * 2;
  const spd = V_MIN + Math.random() * (V_MAX - V_MIN) * 0.6;
  return {
    x:           Math.random() * w,
    y:           Math.random() * h,
    vx:          Math.cos(ang) * spd,
    vy:          Math.sin(ang) * spd,
    flock,
    wanderAngle: Math.random() * Math.PI * 2,
  };
}

function clampMag(x: number, y: number, max: number): [number, number] {
  const m = Math.sqrt(x * x + y * y);
  return m > max && m > 0 ? [x / m * max, y / m * max] : [x, y];
}

function stepBoids(boids: Boid[], dt: number, w: number, h: number): void {
  for (const b of boids) {
    // ── Three boid rules (local perception only) ─────────────────────────
    let sx = 0, sy = 0;  // separation — all nearby birds regardless of flock
    let ax = 0, ay = 0;  // alignment  — own flock only
    let cx = 0, cy = 0;  // cohesion   — own flock only
    let n = 0;

    for (const o of boids) {
      if (o === b) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= PERC_R * PERC_R) continue;

      // Separation applies cross-flock (prevent any clumping)
      if (d2 < SEP_R * SEP_R && d2 > 0) {
        const d = Math.sqrt(d2);
        const strength = 1 - d / SEP_R;
        sx -= (dx / d) * strength;
        sy -= (dy / d) * strength;
      }

      // Alignment + cohesion: own flock only — prevents global convergence
      if (o.flock === b.flock) {
        ax += o.vx; ay += o.vy;
        cx += o.x;  cy += o.y;
        n++;
      }
    }

    const [fsx, fsy] = clampMag(sx, sy, MAX_SEP);

    let fax = 0, fay = 0, fcx = 0, fcy = 0;
    if (n > 0) {
      [fax, fay] = clampMag(ax / n - b.vx, ay / n - b.vy, MAX_ALI);
      [fcx, fcy] = clampMag(cx / n - b.x,  cy / n - b.y,  MAX_COH);
    }

    // ── Wander: slowly rotate a personal heading so the bird never fully
    //    aligns with its flock — prevents single-orb collapse ──────────────
    b.wanderAngle += (Math.random() - 0.5) * 2 * WANDER_RATE * dt;
    const wander_x = Math.cos(b.wanderAngle) * WANDER_R;
    const wander_y = Math.sin(b.wanderAngle) * WANDER_R;

    // ── Soft boundary avoidance ──────────────────────────────────────────
    let bx = 0, by = 0;
    if (b.x < MARGIN)     bx += MAX_WALL * (1 - b.x / MARGIN);
    if (b.x > w - MARGIN) bx -= MAX_WALL * (1 - (w - b.x) / MARGIN);
    if (b.y < MARGIN)     by += MAX_WALL * (1 - b.y / MARGIN);
    if (b.y > h - MARGIN) by -= MAX_WALL * (1 - (h - b.y) / MARGIN);

    b.vx += (fsx + fax + fcx + wander_x + bx) * dt;
    b.vy += (fsy + fay + fcy + wander_y + by) * dt;

    // Clamp speed to [V_MIN, V_MAX]
    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || V_MIN;
    if (spd > V_MAX)      { b.vx *= V_MAX / spd; b.vy *= V_MAX / spd; }
    else if (spd < V_MIN) { b.vx *= V_MIN / spd; b.vy *= V_MIN / spd; }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Hard clamp — safety net
    if (b.x < 0)  { b.x = 0;  b.vx =  Math.abs(b.vx); }
    if (b.x > w)  { b.x = w;  b.vx = -Math.abs(b.vx); }
    if (b.y < 0)  { b.y = 0;  b.vy =  Math.abs(b.vy); }
    if (b.y > h)  { b.y = h;  b.vy = -Math.abs(b.vy); }
  }
}

// Pre-render one glow sprite per flock colour. Stamped via drawImage —
// avoids creating 500 radial gradient objects per frame.
function makeSprite(r: number, g: number, b: number): HTMLCanvasElement {
  const size = SPRITE_R * 2;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const cx = c.getContext('2d')!;
  const grd = cx.createRadialGradient(SPRITE_R, SPRITE_R, 0, SPRITE_R, SPRITE_R, SPRITE_R);
  grd.addColorStop(0,    `rgba(${r},${g},${b},1)`);
  grd.addColorStop(0.3,  `rgba(${r},${g},${b},0.65)`);
  grd.addColorStop(0.7,  `rgba(${r},${g},${b},0.15)`);
  grd.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  cx.fillStyle = grd;
  cx.beginPath();
  cx.arc(SPRITE_R, SPRITE_R, SPRITE_R, 0, Math.PI * 2);
  cx.fill();
  return c;
}

function renderBoids(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  sprites: HTMLCanvasElement[],
): void {
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = GLOW_A;

  const off = SPRITE_R;
  for (const b of boids) {
    ctx.drawImage(sprites[b.flock % sprites.length], b.x - off, b.y - off);
  }

  // Core dots — batched by flock colour to minimise fillStyle switches
  ctx.globalAlpha = DOT_A;
  for (let f = 0; f < N_FLOCKS; f++) {
    const [r, g, bl] = FLOCK_COLORS[f % FLOCK_COLORS.length];
    ctx.fillStyle = `rgba(${r},${g},${bl},1)`;
    ctx.beginPath();
    for (const b of boids) {
      if (b.flock !== f) continue;
      ctx.moveTo(b.x + DOT_R, b.y);
      ctx.arc(b.x, b.y, DOT_R, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────

document.querySelectorAll<HTMLElement>('.gradient-mesh').forEach((mesh) => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  mesh.prepend(canvas);

  const ctx    = canvas.getContext('2d')!;
  const sprites = FLOCK_COLORS.slice(0, N_FLOCKS).map(([r, g, b]) => makeSprite(r, g, b));

  let W = 0, H = 0;
  let boids: Boid[] = [];

  new ResizeObserver(() => {
    W = canvas.width  = mesh.clientWidth;
    H = canvas.height = mesh.clientHeight;
    if (boids.length === 0) {
      boids = Array.from({ length: N_FLOCKS }, (_, f) =>
        Array.from({ length: COUNT }, () => mkBoid(W, H, f))
      ).flat();
    }
  }).observe(mesh);

  if (REDUCED) {
    W = canvas.width  = mesh.clientWidth;
    H = canvas.height = mesh.clientHeight;
    boids = Array.from({ length: N_FLOCKS }, (_, f) =>
      Array.from({ length: COUNT }, () => mkBoid(W, H, f))
    ).flat();
    renderBoids(ctx, boids, sprites);
    return;
  }

  let prev   = 0;
  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  const loop = (t: number) => {
    if (!paused && W > 0) {
      const dt = Math.min((t - prev) / 1000, 0.05);
      if (prev > 0) stepBoids(boids, dt, W, H);
      ctx.clearRect(0, 0, W, H);
      renderBoids(ctx, boids, sprites);
    }
    prev = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
