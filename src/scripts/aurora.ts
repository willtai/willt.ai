/**
 * Northern Lights Aurora — organic gradient animation
 *
 * Uses 3 layers per mesh, each driven by 6 sine waves per axis with
 * irrational frequency ratios (φ, √2, √3, √5, e, π). The result is
 * quasi-random motion that never repeats.
 *
 * Layers use border-radius: 50% (oval shape) to eliminate the straight
 * rectangular edges that appear when a rectangular gradient container
 * is clipped by overflow: hidden.
 *
 * Colour palette: full green spectrum
 *   - Dark forest:  #1a3a2a
 *   - Emerald:      #50C878
 *   - Celadon:      #ACE1AF
 *   - Teal-green:   #2DD4BF
 *   - Sage:         #87AE73
 */

const PHI = 1.618033988749895;
const SQRT2 = 1.4142135623730951;
const SQRT3 = 1.7320508075688772;
const SQRT5 = 2.2360679774997896;
const E = 2.718281828459045;
const PI = Math.PI;

interface AuroraLayer {
  el: HTMLElement;
  xFreqs: number[];
  yFreqs: number[];
  xAmps: number[];
  yAmps: number[];
  xPhases: number[];
  yPhases: number[];
  scaleFreqs: number[];
  scaleAmps: number[];
  rotFreq: number;
  rotAmp: number;
  opacityFreqs: number[];
  opacityBase: number;
  opacityRange: number;
}

function createLayers(): AuroraLayer[] {
  const layers: AuroraLayer[] = [];

  document.querySelectorAll<HTMLElement>(".gradient-mesh").forEach((mesh) => {
    for (let n = 0; n < 3; n++) {
      const el = document.createElement("div");
      el.className = `aurora-layer aurora-layer-${n + 1}`;
      mesh.prepend(el);
    }

    const children = mesh.querySelectorAll<HTMLElement>(".aurora-layer");

    // Layer 1: slow massive sweeps (base curtain)
    layers.push({
      el: children[0],
      xFreqs:  [0.0004, 0.00025 * PHI, 0.00018 * SQRT3, 0.00032 * SQRT2, 0.00014 * E, 0.00021 * SQRT5],
      yFreqs:  [0.00035 * SQRT2, 0.0002 * PHI, 0.00028, 0.00015 * SQRT3, 0.00024 * E, 0.00011 * SQRT5],
      xAmps:   [18, 12, 8, 6, 5, 3],
      yAmps:   [15, 10, 7, 5, 4, 3],
      xPhases: [0, 2.1, 4.7, 1.3, 5.9, 3.4],
      yPhases: [1.1, 3.4, 0.6, 5.2, 2.8, 4.1],
      scaleFreqs: [0.00012 * PHI, 0.00008 * SQRT3],
      scaleAmps: [0.06, 0.03],
      rotFreq: 0.00009 * SQRT2,
      rotAmp: 2.5,
      opacityFreqs: [0.00015 * SQRT3, 0.0001 * PHI],
      opacityBase: 0.55,
      opacityRange: 0.45,
    });

    // Layer 2: medium lateral drift (shimmer)
    layers.push({
      el: children[1],
      xFreqs:  [0.0006 * SQRT2, 0.00038, 0.00052 * PHI, 0.00022 * SQRT3, 0.00045 * E, 0.00016 * SQRT5],
      yFreqs:  [0.00045, 0.0007 * SQRT2, 0.00028 * PHI, 0.0005, 0.00033 * SQRT3, 0.00019 * E],
      xAmps:   [22, 14, 10, 7, 5, 4],
      yAmps:   [12, 18, 8, 5, 6, 3],
      xPhases: [3.1, 0.4, 5.8, 2.2, 4.5, 1.0],
      yPhases: [0.7, 4.1, 1.9, 3.6, 5.3, 2.5],
      scaleFreqs: [0.00018, 0.00012 * SQRT2],
      scaleAmps: [0.05, 0.03],
      rotFreq: 0.00014 * PHI,
      rotAmp: 2,
      opacityFreqs: [0.0002, 0.00014 * SQRT2],
      opacityBase: 0.45,
      opacityRange: 0.55,
    });

    // Layer 3: fast flickers (sparkle)
    layers.push({
      el: children[2],
      xFreqs:  [0.0009, 0.0006 * SQRT3, 0.0011 * PHI, 0.0004 * SQRT2, 0.0008 * E, 0.0005 * SQRT5],
      yFreqs:  [0.0008 * PHI, 0.0005, 0.0012 * SQRT2, 0.0007 * SQRT3, 0.0003 * E, 0.0009 * SQRT5],
      xAmps:   [12, 9, 7, 5, 4, 3],
      yAmps:   [10, 14, 6, 4, 5, 3],
      xPhases: [1.7, 4.3, 0.2, 5.5, 2.9, 3.8],
      yPhases: [2.8, 0.9, 3.7, 6.1, 1.4, 4.6],
      scaleFreqs: [0.0003 * SQRT2, 0.0002 * PHI],
      scaleAmps: [0.04, 0.02],
      rotFreq: 0.00025 * SQRT3,
      rotAmp: 1.5,
      opacityFreqs: [0.00035 * PHI, 0.00025 * E],
      opacityBase: 0.35,
      opacityRange: 0.65,
    });
  });

  return layers;
}

function animate(layers: AuroraLayer[]) {
  function tick(t: number) {
    for (const l of layers) {
      let tx = 0;
      let ty = 0;
      let scale = 1;

      for (let i = 0; i < l.xFreqs.length; i++) {
        tx += Math.sin(t * l.xFreqs[i] + l.xPhases[i]) * l.xAmps[i];
        ty += Math.sin(t * l.yFreqs[i] + l.yPhases[i]) * l.yAmps[i];
      }

      for (let i = 0; i < l.scaleFreqs.length; i++) {
        scale += Math.sin(t * l.scaleFreqs[i]) * l.scaleAmps[i];
      }

      const rotate = Math.sin(t * l.rotFreq) * l.rotAmp;

      let opacityMod = 0;
      for (let i = 0; i < l.opacityFreqs.length; i++) {
        opacityMod += Math.sin(t * l.opacityFreqs[i] + i * 1.7);
      }
      opacityMod /= l.opacityFreqs.length;
      const opacity = l.opacityBase + l.opacityRange * (0.5 + 0.5 * opacityMod);

      l.el.style.transform = `translate(${tx}%, ${ty}%) scale(${scale}) rotate(${rotate}deg)`;
      l.el.style.opacity = String(Math.min(1, Math.max(0, opacity)));
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// Inject styles — disable CSS fallback, define JS-driven aurora layers
const style = document.createElement("style");
style.textContent = `
  .gradient-mesh::before,
  .gradient-mesh::after {
    animation: none !important;
    opacity: 0 !important;
  }
  .aurora-layer {
    position: absolute;
    inset: -60%;
    pointer-events: none;
    z-index: 0;
    will-change: transform, opacity;
    border-radius: 50%;
  }
  /* Layer 1: large emerald + forest curtains */
  .aurora-layer-1 {
    background:
      radial-gradient(ellipse 80% 50% at 30% 30%, rgba(80, 200, 120, 0.5) 0%, transparent 60%),
      radial-gradient(ellipse 60% 70% at 70% 20%, rgba(26, 58, 42, 0.55) 0%, transparent 55%),
      radial-gradient(ellipse 70% 60% at 40% 75%, rgba(45, 212, 191, 0.35) 0%, transparent 55%),
      radial-gradient(ellipse 50% 50% at 80% 60%, rgba(80, 200, 120, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 20% 55%, rgba(135, 174, 115, 0.35) 0%, transparent 50%);
  }
  /* Layer 2: celadon + sage drift */
  .aurora-layer-2 {
    background:
      radial-gradient(ellipse 70% 45% at 65% 35%, rgba(172, 225, 175, 0.4) 0%, transparent 60%),
      radial-gradient(ellipse 55% 65% at 25% 60%, rgba(135, 174, 115, 0.45) 0%, transparent 55%),
      radial-gradient(ellipse 80% 40% at 50% 15%, rgba(80, 200, 120, 0.35) 0%, transparent 55%),
      radial-gradient(ellipse 50% 55% at 75% 70%, rgba(45, 212, 191, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse 60% 50% at 35% 40%, rgba(172, 225, 175, 0.25) 0%, transparent 50%);
  }
  /* Layer 3: bright emerald + teal flickers */
  .aurora-layer-3 {
    background:
      radial-gradient(ellipse 50% 50% at 55% 40%, rgba(52, 211, 153, 0.45) 0%, transparent 50%),
      radial-gradient(ellipse 40% 60% at 30% 25%, rgba(45, 212, 191, 0.4) 0%, transparent 55%),
      radial-gradient(ellipse 55% 35% at 75% 70%, rgba(172, 225, 175, 0.35) 0%, transparent 50%),
      radial-gradient(ellipse 45% 45% at 50% 55%, rgba(80, 200, 120, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse 35% 50% at 20% 75%, rgba(135, 174, 115, 0.3) 0%, transparent 45%);
  }
`;
document.head.appendChild(style);

const layers = createLayers();
if (layers.length > 0) {
  animate(layers);
}
