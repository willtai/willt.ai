/**
 * Northern Lights Aurora — dramatic organic gradient animation
 *
 * Uses 3 layers per mesh, each driven by 4 sine waves with irrational
 * frequency ratios (φ, √2, √3, π). The result is quasi-random motion
 * that never repeats. Amplitudes are large (15-35%) for visible,
 * dramatic curtain-like movement.
 *
 * Colour palette: full green spectrum only
 *   - Dark forest:  #1a3a2a (deep anchor)
 *   - Emerald:      #50C878 (bright mid)
 *   - Celadon:      #ACE1AF (light, airy)
 *   - Teal-green:   #2DD4BF (cool edge)
 *   - Sage:         #87AE73 (warm mid)
 */

const PHI = 1.618033988749895;
const SQRT2 = 1.4142135623730951;
const SQRT3 = 1.7320508075688772;
const PI = Math.PI;

interface AuroraLayer {
  el: HTMLElement;
  // 4 sine oscillators per axis
  xFreqs: number[];
  yFreqs: number[];
  xAmps: number[];
  yAmps: number[];
  xPhases: number[];
  yPhases: number[];
  scaleFreq: number;
  scaleAmp: number;
  rotFreq: number;
  rotAmp: number;
  opacityFreq: number;
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

    // Layer 1: slow, massive sweeps (the base curtain)
    layers.push({
      el: children[0],
      xFreqs: [0.0004, 0.00025 * PHI, 0.00018 * SQRT3, 0.00032 * SQRT2],
      yFreqs: [0.00035 * SQRT2, 0.0002 * PHI, 0.00028, 0.00015 * SQRT3],
      xAmps: [18, 12, 8, 6],
      yAmps: [15, 10, 7, 5],
      xPhases: [0, 2.1, 4.7, 1.3],
      yPhases: [1.1, 3.4, 0.6, 5.2],
      scaleFreq: 0.00012 * PHI,
      scaleAmp: 0.08,
      rotFreq: 0.00009 * SQRT2,
      rotAmp: 2,
      opacityFreq: 0.00015 * SQRT3,
      opacityBase: 0.6,
      opacityRange: 0.4,
    });

    // Layer 2: medium speed, lateral drift (the shimmer)
    layers.push({
      el: children[1],
      xFreqs: [0.0006 * SQRT2, 0.00038, 0.00052 * PHI, 0.00022 * SQRT3],
      yFreqs: [0.00045, 0.0007 * SQRT2, 0.00028 * PHI, 0.0005],
      xAmps: [22, 14, 10, 7],
      yAmps: [12, 18, 8, 5],
      xPhases: [3.1, 0.4, 5.8, 2.2],
      yPhases: [0.7, 4.1, 1.9, 3.6],
      scaleFreq: 0.00018,
      scaleAmp: 0.06,
      rotFreq: 0.00014 * PHI,
      rotAmp: 1.5,
      opacityFreq: 0.0002,
      opacityBase: 0.5,
      opacityRange: 0.5,
    });

    // Layer 3: fast, small flickers (the sparkle)
    layers.push({
      el: children[2],
      xFreqs: [0.0009, 0.0006 * SQRT3, 0.0011 * PHI, 0.0004 * SQRT2],
      yFreqs: [0.0008 * PHI, 0.0005, 0.0012 * SQRT2, 0.0007 * SQRT3],
      xAmps: [10, 8, 6, 4],
      yAmps: [8, 12, 5, 3],
      xPhases: [1.7, 4.3, 0.2, 5.5],
      yPhases: [2.8, 0.9, 3.7, 6.1],
      scaleFreq: 0.0003 * SQRT2,
      scaleAmp: 0.04,
      rotFreq: 0.00025 * SQRT3,
      rotAmp: 1,
      opacityFreq: 0.00035 * PHI,
      opacityBase: 0.4,
      opacityRange: 0.6,
    });
  });

  return layers;
}

function animate(layers: AuroraLayer[]) {
  function tick(t: number) {
    for (const l of layers) {
      let tx = 0;
      let ty = 0;

      for (let i = 0; i < l.xFreqs.length; i++) {
        tx += Math.sin(t * l.xFreqs[i] + l.xPhases[i]) * l.xAmps[i];
        ty += Math.sin(t * l.yFreqs[i] + l.yPhases[i]) * l.yAmps[i];
      }

      const scale = 1 + Math.sin(t * l.scaleFreq) * l.scaleAmp;
      const rotate = Math.sin(t * l.rotFreq) * l.rotAmp;
      const opacity = l.opacityBase + l.opacityRange * (0.5 + 0.5 * Math.sin(t * l.opacityFreq));

      l.el.style.transform = `translate(${tx}%, ${ty}%) scale(${scale}) rotate(${rotate}deg)`;
      l.el.style.opacity = String(Math.min(1, opacity));
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// Inject styles — disable CSS animations, define JS-driven layers
const style = document.createElement("style");
style.textContent = `
  .gradient-mesh::before,
  .gradient-mesh::after {
    animation: none !important;
    opacity: 0 !important;
  }
  .aurora-layer {
    position: absolute;
    inset: -40%;
    pointer-events: none;
    z-index: 0;
    will-change: transform, opacity;
  }
  /* Layer 1: large emerald + forest curtains */
  .aurora-layer-1 {
    background:
      radial-gradient(ellipse 130% 70% at 15% 25%, rgba(80, 200, 120, 0.45) 0%, transparent 50%),
      radial-gradient(ellipse 90% 90% at 75% 15%, rgba(26, 58, 42, 0.5) 0%, transparent 45%),
      radial-gradient(ellipse 70% 100% at 40% 80%, rgba(45, 212, 191, 0.3) 0%, transparent 50%);
  }
  /* Layer 2: celadon + sage drift */
  .aurora-layer-2 {
    background:
      radial-gradient(ellipse 110% 55% at 70% 35%, rgba(172, 225, 175, 0.35) 0%, transparent 55%),
      radial-gradient(ellipse 80% 80% at 20% 65%, rgba(135, 174, 115, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse 100% 50% at 50% 10%, rgba(80, 200, 120, 0.3) 0%, transparent 50%);
  }
  /* Layer 3: bright emerald + teal flickers */
  .aurora-layer-3 {
    background:
      radial-gradient(ellipse 60% 60% at 60% 40%, rgba(52, 211, 153, 0.4) 0%, transparent 45%),
      radial-gradient(ellipse 50% 70% at 30% 20%, rgba(45, 212, 191, 0.35) 0%, transparent 50%),
      radial-gradient(ellipse 70% 40% at 80% 75%, rgba(172, 225, 175, 0.3) 0%, transparent 45%);
  }
`;
document.head.appendChild(style);

const layers = createLayers();
if (layers.length > 0) {
  animate(layers);
}
