/** Samples retain panel coordinates so the wrist can bend without resampling. */
export interface BirdSample {
  part: "body" | "inner" | "outer";
  side: number;
  s: number;
  c: number;
  forward: number;
  right: number;
}

export interface Point2 { x: number; y: number }

/** Deterministic, area-weighted samples of the same polygons used by addBird. */
export function sampleGiantBird(m: number, seed: number): BirdSample[] {
  let state = (seed >>> 0) || 1;
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const result: BirdSample[] = [];
  const count = Math.max(0, Math.floor(m));
  const bodyCount = Math.max(1, Math.round(count * 0.2));
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      result.push({ part: "body", side: 0, s: 0, c: 0, forward: 0.19, right: 0 });
    } else if (i < bodyCount) {
      // Rejection sampling is uniform inside the tapered body polygon.
      let forward: number, right: number, width: number;
      do {
        forward = -0.24 + random() * 0.43;
        right = (random() * 2 - 1) * 0.055;
        width = forward > 0.05 ? (0.19 - forward) * 0.05 / 0.14 : 0.055 - (forward + 0.24) * 0.005 / 0.29;
      } while (Math.abs(right) > width);
      result.push({ part: "body", side: 0, s: 0, c: 0, forward, right });
    } else {
      const side = (i - bodyCount) % 2 ? -1 : 1;
      // Inner quad area .027375; outer (degenerate quad) triangle .019675.
      const part = random() < 0.027375 / 0.04705 ? "inner" : "outer";
      let s = random(), c = random();
      if (part === "inner") {
        // Bilinear quad Jacobian: .0378 - .01095*s - .0099*c.
        while (random() * 0.0378 > 0.0378 - 0.01095 * s - 0.0099 * c) {
          s = random(); c = random();
        }
      } else {
        s = 1 - Math.sqrt(1 - s);
      }
      result.push({ part, side, s, c, forward: 0, right: 0 });
    }
  }
  return result;
}

/** Writes (forward,right,up) in-place; no allocations in the animation loop. */
export function mapBirdSample(sample: BirdSample, th: number, out: Float32Array): void {
  if (sample.part === "body") {
    out[0] = sample.forward; out[1] = sample.right; out[2] = 0;
    return;
  }
  const { s, c, side } = sample;
  const th2 = th * 1.45 + 0.05;
  const c1 = Math.cos(th), s1 = Math.sin(th), c2 = Math.cos(th2), s2 = Math.sin(th2);
  if (sample.part === "inner") {
    const rootF = 0.08 - 0.18 * c, wristF = 0.05 - 0.12 * c;
    const wristR = 0.25 - 0.055 * c;
    const r = 0.04 + (wristR - 0.04) * s;
    out[0] = rootF + (wristF - rootF) * s;
    out[1] = side * c1 * r; out[2] = s1 * r;
  } else {
    const wristF = 0.05 - 0.12 * c, wristR = 0.25 - 0.055 * c;
    out[0] = wristF + (-0.12 - wristF) * s;
    out[1] = side * (c1 * wristR * (1 - s) + (c1 * 0.25 + c2 * 0.25) * s);
    out[2] = s1 * wristR * (1 - s) + (s1 * 0.25 + s2 * 0.25) * s;
  }
}

/** Result[bird index] is its target index. Stable tie breaks keep it a permutation. */
export function pairByAngle(birds: readonly Point2[], targets: readonly Point2[]): Int32Array {
  if (birds.length !== targets.length) throw new RangeError("Bird and target counts must match");
  const sorted = (points: readonly Point2[]): number[] => {
    let x = 0, y = 0;
    for (const p of points) { x += p.x; y += p.y; }
    x /= points.length || 1; y /= points.length || 1;
    return points.map((_, i) => i).sort((a, b) =>
      Math.atan2(points[a].y - y, points[a].x - x) - Math.atan2(points[b].y - y, points[b].x - x) || a - b);
  };
  const b = sorted(birds), t = sorted(targets), pairs = new Int32Array(b.length);
  for (let i = 0; i < b.length; i++) pairs[b[i]] = t[i];
  return pairs;
}
