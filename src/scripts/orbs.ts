/**
 * Murmuration — 500 glowing orbs in Reynolds boids formation.
 *
 * Performance approach:
 *   - Glow: pre-rendered sprite canvas stamped via drawImage (no per-frame
 *     radial gradient allocation, no GC pressure)
 *   - Core dots: single batched beginPath/fill per frame
 *   - Additive blending: overlapping glows stack naturally, flock core glows bright
 *
 * Palette: --color-glow #34d399 / --color-teal #0d9488 / --color-celadon #ACE1AF
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Boid tuning ────────────────────────────────────────────────────────────
const COUNT    = 500;
const V_MAX    = 130;  // px/sec — active, energetic flock
const V_MIN    = 45;   // px/sec — always in motion
const PERC_R   = 90;   // perception radius px
const SEP_R    = 20;   // separation radius px
const MAX_SEP  = 320;  // max separation acceleration px/sec²
const MAX_ALI  = 210;  // max alignment acceleration px/sec²
const MAX_COH  = 70;   // max cohesion acceleration px/sec²
const MAX_WALL = 500;  // boundary turn force px/sec²
const MARGIN   = 110;  // px from edge where boundary force kicks in
const NOISE    = 15;   // random jitter px/sec² (keeps flock organic)

// ─── Visual tuning ──────────────────────────────────────────────────────────
const SPRITE_R = 22;   // glow sprite radius px
const GLOW_A   = 0.07; // per-bird glow alpha (additive stacking = bright flock)
const DOT_R    = 2.0;  // core dot radius px
const DOT_A    = 0.72; // core dot alpha

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function mkBoid(w: number, h: number): Boid {
  const ang = Math.random() * Math.PI * 2;
  const spd = V_MIN + Math.random() * (V_MAX - V_MIN) * 0.5;
  // Spawn in middle 60% of screen so birds are immediately visible as a flock
  return {
    x:  w * 0.2 + Math.random() * w * 0.6,
    y:  h * 0.2 + Math.random() * h * 0.6,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
  };
}

// Clamp vector magnitude to [0, max]; returns [cx, cy]
function clampVec(x: number, y: number, max: number): [number, number] {
  const m = Math.sqrt(x * x + y * y);
  return m > max ? [x / m * max, y / m * max] : [x, y];
}

function stepBoids(boids: Boid[], dt: number, w: number, h: number): void {
  for (const b of boids) {
    // Accumulate steering vectors
    let sx = 0, sy = 0;  // separation
    let ax = 0, ay = 0;  // alignment (avg neighbor velocity)
    let cx = 0, cy = 0;  // cohesion (avg neighbor position)
    let n = 0;

    for (const o of boids) {
      if (o === b) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= PERC_R * PERC_R) continue;

      ax += o.vx; ay += o.vy;
      cx += o.x;  cy += o.y;
      n++;

      if (d2 < SEP_R * SEP_R && d2 > 0) {
        // Steer away: direction away × inverse-linear falloff
        const d = Math.sqrt(d2);
        const strength = 1 - d / SEP_R;
        sx -= (dx / d) * strength;
        sy -= (dy / d) * strength;
      }
    }

    // Separation: already a direction vector, clamp magnitude
    let [fsx, fsy] = clampVec(sx, sy, MAX_SEP);

    let fax = 0, fay = 0, fcx = 0, fcy = 0;
    if (n > 0) {
      // Alignment: steer toward average neighbor velocity
      const adx = ax / n - b.vx;
      const ady = ay / n - b.vy;
      [fax, fay] = clampVec(adx, ady, MAX_ALI);

      // Cohesion: steer toward centroid of neighbors
      const cdx = cx / n - b.x;
      const cdy = cy / n - b.y;
      [fcx, fcy] = clampVec(cdx, cdy, MAX_COH);
    }

    // Soft boundary avoidance: force ramps up as bird approaches wall
    let bx = 0, by = 0;
    if (b.x < MARGIN)       bx += MAX_WALL * (1 - b.x / MARGIN);
    if (b.x > w - MARGIN)   bx -= MAX_WALL * (1 - (w - b.x) / MARGIN);
    if (b.y < MARGIN)       by += MAX_WALL * (1 - b.y / MARGIN);
    if (b.y > h - MARGIN)   by -= MAX_WALL * (1 - (h - b.y) / MARGIN);

    // Random organic jitter
    const nx = (Math.random() - 0.5) * 2 * NOISE;
    const ny = (Math.random() - 0.5) * 2 * NOISE;

    b.vx += (fsx + fax + fcx + bx + nx) * dt;
    b.vy += (fsy + fay + fcy + by + ny) * dt;

    // Clamp to [V_MIN, V_MAX]
    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || V_MIN;
    if (spd > V_MAX)      { b.vx *= V_MAX / spd; b.vy *= V_MAX / spd; }
    else if (spd < V_MIN) { b.vx *= V_MIN / spd; b.vy *= V_MIN / spd; }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Hard clamp — safety net if boundary force wasn't enough
    if (b.x < 0)    { b.x = 0;  b.vx = Math.abs(b.vx); }
    if (b.x > w)    { b.x = w;  b.vx = -Math.abs(b.vx); }
    if (b.y < 0)    { b.y = 0;  b.vy = Math.abs(b.vy); }
    if (b.y > h)    { b.y = h;  b.vy = -Math.abs(b.vy); }
  }
}

// Pre-render a single glow sprite. Used with drawImage — much faster than
// creating 500 radial gradients per frame.
function makeGlowSprite(): HTMLCanvasElement {
  const size = SPRITE_R * 2;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const cx = c.getContext('2d')!;
  const g = cx.createRadialGradient(SPRITE_R, SPRITE_R, 0, SPRITE_R, SPRITE_R, SPRITE_R);
  g.addColorStop(0,    'rgba(52,211,153,1)');   // --color-glow core
  g.addColorStop(0.3,  'rgba(52,211,153,0.7)');
  g.addColorStop(0.65, 'rgba(13,148,136,0.25)'); // --color-teal fade
  g.addColorStop(1,    'rgba(13,148,136,0)');
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(SPRITE_R, SPRITE_R, SPRITE_R, 0, Math.PI * 2);
  cx.fill();
  return c;
}

function renderBoids(
  ctx: CanvasRenderingContext2D,
  boids: Boid[],
  sprite: HTMLCanvasElement,
): void {
  ctx.globalCompositeOperation = 'lighter';

  // Glow halos: stamp pre-rendered sprite for each bird
  ctx.globalAlpha = GLOW_A;
  const off = SPRITE_R;
  for (const b of boids) {
    ctx.drawImage(sprite, b.x - off, b.y - off);
  }

  // Core dots: one batched path fill (much faster than 500 arc() + fill() calls)
  ctx.globalAlpha = DOT_A;
  ctx.fillStyle = 'rgba(172,225,175,1)'; // --color-celadon: slightly cool to contrast glow
  ctx.beginPath();
  for (const b of boids) {
    ctx.moveTo(b.x + DOT_R, b.y);
    ctx.arc(b.x, b.y, DOT_R, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// ─── Bootstrap: one flock per .gradient-mesh section ────────────────────────

document.querySelectorAll<HTMLElement>('.gradient-mesh').forEach((mesh) => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  mesh.prepend(canvas);

  const ctx = canvas.getContext('2d')!;
  const sprite = makeGlowSprite();

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
    renderBoids(ctx, boids, sprite);
    return;
  }

  let prev   = 0;
  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  const loop = (t: number) => {
    if (!paused && W > 0) {
      const dt = Math.min((t - prev) / 1000, 0.05); // seconds; cap prevents spiral-of-death on tab restore
      if (prev > 0) stepBoids(boids, dt, W, H);
      ctx.clearRect(0, 0, W, H);
      renderBoids(ctx, boids, sprite);
    }
    prev = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
