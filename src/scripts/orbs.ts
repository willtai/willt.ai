/**
 * Murmuration — 400 glowing orbs in Reynolds boids formation.
 *
 * Design principle: separation + alignment + wander, NO cohesion.
 * Without a shared centroid, birds can never permanently converge into one ball.
 * Instead they form local flowing streams that briefly merge (additive glow
 * brightens at intersections) then peel apart as each bird's wander angle
 * gradually pulls it in its own direction.
 *
 * Three visual depth layers (large/faint → small/bright) are purely cosmetic —
 * all birds use identical boid physics. Additive blending means dense passes
 * bloom bright; lone birds are soft and subtle.
 *
 * Palette: --color-glow #34d399 / --color-teal #0d9488 / --color-celadon #ACE1AF
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Population ─────────────────────────────────────────────────────────────
const COUNT = 400; // total birds across all layers

// ─── Boid physics ───────────────────────────────────────────────────────────
const V_MAX  = 60;  // px/sec — slow, dreamlike drift
const V_MIN  = 16;  // px/sec
const PERC_R = 85;  // perception radius — local only, prevents global order
const SEP_R  = 45;  // separation radius — birds avoid getting this close
// No cohesion: removing the centroid pull is what prevents permanent convergence.
// Without it, clusters are temporary — streams form, meet, and diverge naturally.
const MAX_SEP  = 280; // separation force cap px/sec²
const MAX_ALI  = 110; // alignment force cap px/sec² — strong: local streams form fast
const MAX_WALL   = 200; // boundary avoidance force cap px/sec² (left/right only)
const MARGIN     = 140; // px from left/right edge where wall force begins
const DRIFT_DOWN =  20; // px/sec² constant downward bias — net flow top→bottom
// Wander: each bird has a personal heading that slowly rotates.
// This is what causes streams to split — even birds flying together gradually
// diverge as their wander angles drift apart.
const WANDER_SPEED = 30;  // px/sec² — how hard the bird pushes its own direction
const WANDER_RATE  = 0.45; // rad/sec max — how fast the personal angle rotates

// ─── Visual layers ──────────────────────────────────────────────────────────
// Layer 0: large, very faint — ambient depth behind the action
// Layer 1: medium, moderate  — main flowing streams
// Layer 2: small, bright     — foreground sparks; these pop on dense passes
interface Layer { r: number; alpha: number; dotR: number; dotA: number; share: number }
const LAYERS: Layer[] = [
  { r: 48, alpha: 0.038, dotR: 0.0, dotA: 0.00, share: 0.20 }, //  80 birds
  { r: 24, alpha: 0.075, dotR: 1.8, dotA: 0.55, share: 0.50 }, // 200 birds
  { r: 13, alpha: 0.130, dotR: 2.6, dotA: 0.88, share: 0.30 }, // 120 birds
];

interface Boid {
  x: number; y: number;
  vx: number; vy: number;
  wanderAngle: number;
  layer: number;
}

function mkBoid(w: number, h: number): Boid {
  const ang = Math.random() * Math.PI * 2;
  const spd = V_MIN + Math.random() * (V_MAX - V_MIN) * 0.75;
  const r = Math.random();
  const layer = r < LAYERS[0].share ? 0 : r < LAYERS[0].share + LAYERS[1].share ? 1 : 2;
  return {
    x:           Math.random() * w,
    y:           Math.random() * h,
    vx:          Math.cos(ang) * spd,
    vy:          Math.sin(ang) * spd,
    wanderAngle: Math.random() * Math.PI * 2,
    layer,
  };
}

function clampMag(x: number, y: number, max: number): [number, number] {
  const m = Math.sqrt(x * x + y * y);
  return m > max && m > 0 ? [x / m * max, y / m * max] : [x, y];
}

function stepBoids(boids: Boid[], dt: number, w: number, h: number): void {
  for (const b of boids) {
    let sx = 0, sy = 0; // separation
    let ax = 0, ay = 0; // alignment
    let n = 0;

    for (const o of boids) {
      if (o === b) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= PERC_R * PERC_R) continue;

      // Alignment — match speed and direction of nearby birds
      ax += o.vx; ay += o.vy;
      n++;

      // Separation — steer away from birds that are too close
      if (d2 < SEP_R * SEP_R && d2 > 0) {
        const d   = Math.sqrt(d2);
        const str = 1 - d / SEP_R; // linear falloff: strongest at d=0
        sx -= (dx / d) * str;
        sy -= (dy / d) * str;
      }
    }

    const [fsx, fsy] = clampMag(sx, sy, MAX_SEP);
    let fax = 0, fay = 0;
    if (n > 0) [fax, fay] = clampMag(ax / n - b.vx, ay / n - b.vy, MAX_ALI);

    // Wander — slowly rotate the bird's personal preferred heading
    b.wanderAngle += (Math.random() - 0.5) * 2 * WANDER_RATE * dt;
    const wx = Math.cos(b.wanderAngle) * WANDER_SPEED;
    const wy = Math.sin(b.wanderAngle) * WANDER_SPEED;

    // Left/right boundary avoidance only — top/bottom are toroidal (see below)
    let bx = 0;
    if (b.x < MARGIN)     bx += MAX_WALL * (1 - b.x / MARGIN);
    if (b.x > w - MARGIN) bx -= MAX_WALL * (1 - (w - b.x) / MARGIN);

    b.vx += (fsx + fax + wx + bx) * dt;
    b.vy += (fsy + fay + wy + DRIFT_DOWN) * dt; // constant downward pull

    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || V_MIN;
    if (spd > V_MAX)      { b.vx *= V_MAX / spd; b.vy *= V_MAX / spd; }
    else if (spd < V_MIN) { b.vx *= V_MIN / spd; b.vy *= V_MIN / spd; }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Toroidal Y wrap — birds exiting the bottom reappear at the top.
    // Buffer of 60px (> largest sprite radius) prevents visible popping.
    const buf = 60;
    if (b.y > h + buf) b.y -= h + buf * 2;
    if (b.y < -buf)    b.y += h + buf * 2;

    // Hard clamp X — left/right are hard walls, not toroidal
    if (b.x < 0) { b.x = 0; b.vx =  Math.abs(b.vx); }
    if (b.x > w) { b.x = w; b.vx = -Math.abs(b.vx); }
  }
}

// Pre-render one glow sprite per layer. Stamped via drawImage each frame —
// avoids allocating 400 radial gradient objects per frame (GC pressure).
function makeSprite(layer: Layer): HTMLCanvasElement {
  const { r } = layer;
  const size = r * 2;
  const c    = document.createElement('canvas');
  c.width = c.height = size;
  const cx = c.getContext('2d')!;
  const g  = cx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0,    'rgba(52,211,153,1)');    // --color-glow: bright emerald core
  g.addColorStop(0.28, 'rgba(52,211,153,0.75)');
  g.addColorStop(0.62, 'rgba(13,148,136,0.28)'); // --color-teal: cool fade
  g.addColorStop(1,    'rgba(13,148,136,0)');
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.fill();
  return c;
}

function renderBoids(
  ctx:     CanvasRenderingContext2D,
  boids:   Boid[],
  sprites: HTMLCanvasElement[],
): void {
  ctx.globalCompositeOperation = 'lighter';

  // Draw back-to-front so foreground sparks bloom on top of ambient glow
  for (let l = 0; l < LAYERS.length; l++) {
    const { alpha, dotR, dotA } = LAYERS[l];
    const sprite = sprites[l];
    const off    = sprite.width / 2;

    // Glow halos
    ctx.globalAlpha = alpha;
    for (const b of boids) {
      if (b.layer !== l) continue;
      ctx.drawImage(sprite, b.x - off, b.y - off);
    }

    // Core dots (only layers 1 and 2 — background layer is glow-only)
    if (dotR > 0) {
      ctx.globalAlpha = dotA;
      ctx.fillStyle = 'rgba(172,225,175,1)'; // --color-celadon: cooler than glow, creates contrast
      ctx.beginPath();
      for (const b of boids) {
        if (b.layer !== l) continue;
        ctx.moveTo(b.x + dotR, b.y);
        ctx.arc(b.x, b.y, dotR, 0, Math.PI * 2);
      }
      ctx.fill();
    }
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

  const ctx     = canvas.getContext('2d')!;
  const sprites = LAYERS.map(makeSprite);

  let W = 0, H = 0;
  let boids: Boid[] = [];

  new ResizeObserver(() => {
    W = canvas.width  = mesh.clientWidth;
    H = canvas.height = mesh.clientHeight;
    if (boids.length === 0) boids = Array.from({ length: COUNT }, () => mkBoid(W, H));
  }).observe(mesh);

  if (REDUCED) {
    W = canvas.width  = mesh.clientWidth;
    H = canvas.height = mesh.clientHeight;
    boids = Array.from({ length: COUNT }, () => mkBoid(W, H));
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
