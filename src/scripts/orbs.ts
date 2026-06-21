/**
 * Ethereal floating orbs — Reynolds boids flocking on canvas.
 * Injects an absolutely-positioned canvas into every .gradient-mesh section.
 *
 * Palette drawn from site CSS tokens:
 *   --color-glow    #34d399 → [52, 211, 153]
 *   --color-teal    #0d9488 → [13, 148, 136]
 *   --color-celadon #ACE1AF → [172, 225, 175]
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type RGB = [number, number, number];

const PALETTE: RGB[] = [
  [52, 211, 153],  // glow   (weighted 2×)
  [52, 211, 153],  // glow
  [13, 148, 136],  // teal
  [172, 225, 175], // celadon
  [80, 200, 120],  // emerald mid
];

// Boid parameters
const COUNT  = 32;
const V_MAX  = 28;    // px/sec
const V_MIN  = 5;     // px/sec
const PERC   = 160;   // perception radius px
const SEP_R  = 55;    // separation radius px
const W_S    = 120;   // separation weight
const W_A    = 18;    // alignment weight
const W_C    = 0.055; // cohesion weight (raw px offset → tiny scale)
const BIAS   = 1.8;   // rightward drift bias, px/sec²
const BOB_F  = 0.00075; // bobbing frequency, rad/ms

interface Boid {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  color: RGB;
  bobPhase: number;
  bobAmp: number;
  layer: 0 | 1 | 2;
}

function mkBoid(w: number, h: number, rx = true, ry = true): Boid {
  const layer = (Math.random() < 0.25 ? 0 : Math.random() < 0.5 ? 1 : 2) as 0 | 1 | 2;
  const ang = Math.random() * Math.PI * 2;
  const spd = V_MIN + Math.random() * (V_MAX - V_MIN);
  return {
    x:        rx ? Math.random() * w : -200,
    y:        ry ? Math.random() * h : Math.random() * h,
    vx:       Math.cos(ang) * spd,
    vy:       Math.sin(ang) * spd,
    r:        layer === 0 ? 80 + Math.random() * 110 : layer === 1 ? 38 + Math.random() * 52 : 15 + Math.random() * 26,
    alpha:    layer === 0 ? 0.05 + Math.random() * 0.08 : layer === 1 ? 0.11 + Math.random() * 0.13 : 0.20 + Math.random() * 0.17,
    color:    PALETTE[Math.floor(Math.random() * PALETTE.length)],
    bobPhase: Math.random() * Math.PI * 2,
    bobAmp:   2 + Math.random() * 5,
    layer,
  };
}

function stepBoids(boids: Boid[], dt: number, w: number, h: number): void {
  for (const b of boids) {
    let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;

    for (const o of boids) {
      if (o === b) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= PERC * PERC) continue;

      ax += o.vx; ay += o.vy;
      cx += o.x;  cy += o.y;
      n++;

      if (d2 < SEP_R * SEP_R && d2 > 0) {
        sx -= dx / d2;
        sy -= dy / d2;
      }
    }

    if (n > 0) {
      // Alignment: steer toward average neighbor velocity
      ax = ax / n - b.vx;
      ay = ay / n - b.vy;
      // Cohesion: steer toward centroid of neighbors
      cx = cx / n - b.x;
      cy = cy / n - b.y;
    }

    b.vx += (W_S * sx + W_A * ax + W_C * cx + BIAS) * dt;
    b.vy += (W_S * sy + W_A * ay + W_C * cy) * dt;

    // Clamp speed to [V_MIN, V_MAX]
    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || V_MIN;
    if (spd > V_MAX)      { b.vx *= V_MAX / spd; b.vy *= V_MAX / spd; }
    else if (spd < V_MIN) { b.vx *= V_MIN / spd; b.vy *= V_MIN / spd; }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Wrap edges — respawn on opposite side so motion is continuous
    const m = b.r * 2.5;
    if (b.x > w + m) { b.x = -m;     b.y = Math.random() * h; }
    if (b.x < -m)    { b.x = w + m;  b.y = Math.random() * h; }
    if (b.y > h + m) { b.y = -m; }
    if (b.y < -m)    { b.y = h + m; }
  }
}

function renderBoids(ctx: CanvasRenderingContext2D, boids: Boid[], t: number): void {
  const sorted = [...boids].sort((a, b) => a.layer - b.layer);

  for (const b of sorted) {
    const x = b.x;
    const y = b.y + Math.sin(t * BOB_F + b.bobPhase) * b.bobAmp;
    const [r, g, bl] = b.color;

    // Outer bloom
    const bloom = ctx.createRadialGradient(x, y, 0, x, y, b.r * 2.4);
    bloom.addColorStop(0, `rgba(${r},${g},${bl},${(b.alpha * 0.2).toFixed(3)})`);
    bloom.addColorStop(1, `rgba(${r},${g},${bl},0)`);
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(x, y, b.r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Core orb with bright centre fading to transparent
    const core = ctx.createRadialGradient(x, y, 0, x, y, b.r);
    core.addColorStop(0,    `rgba(${r},${g},${bl},${b.alpha.toFixed(3)})`);
    core.addColorStop(0.42, `rgba(${r},${g},${bl},${(b.alpha * 0.42).toFixed(3)})`);
    core.addColorStop(1,    `rgba(${r},${g},${bl},0)`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, b.r, 0, Math.PI * 2);
    ctx.fill();

    // Abstract bird silhouette — two wing arcs facing direction of travel
    const ang = Math.atan2(b.vy, b.vx);
    const s   = Math.max(4, b.r * 0.16);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.strokeStyle = `rgba(172,225,175,${(b.alpha * 0.38).toFixed(3)})`;
    ctx.lineWidth = Math.max(0.4, s * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 0.88, -s * 0.46, -s * 1.75, s * 0.08);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo( s * 0.88, -s * 0.46,  s * 1.75, s * 0.08);
    ctx.stroke();
    ctx.restore();
  }
}

document.querySelectorAll<HTMLElement>('.gradient-mesh').forEach((mesh) => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  mesh.prepend(canvas);

  const ctx = canvas.getContext('2d')!;
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
    renderBoids(ctx, boids, 0);
    return;
  }

  let prev  = 0;
  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  const loop = (t: number) => {
    if (!paused && W > 0) {
      const dt = Math.min((t - prev) / 1000, 0.05); // seconds; cap avoids spiral-of-death
      if (prev > 0) stepBoids(boids, dt, W, H);
      ctx.clearRect(0, 0, W, H);
      renderBoids(ctx, boids, t);
    }
    prev = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
