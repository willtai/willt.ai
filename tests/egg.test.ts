import { describe, expect, it } from "vitest";
import { sampleGiantBird, pairByAngle } from "../src/scripts/murmuration";
import { mapBirdSample } from "../src/scripts/giant-bird";

describe("giant bird geometry", () => {
  it("returns exactly the requested count, including an empty flock", () => {
    for (const n of [0, 1, 10, 160, 650, 1500]) expect(sampleGiantBird(n, 42)).toHaveLength(n);
  });
  it("is deterministic for a seed and varies between seeds", () => {
    expect(sampleGiantBird(160, 42)).toEqual(sampleGiantBird(160, 42));
    expect(sampleGiantBird(160, 42)).not.toEqual(sampleGiantBird(160, 43));
  });
  it("keeps every mapped sample inside the model bounds throughout a wingbeat", () => {
    const out = new Float32Array(3);
    for (const seed of [0, 42, 0xffffffff]) {
      for (const sample of sampleGiantBird(650, seed)) {
        expect(sample.s).toBeGreaterThanOrEqual(0);
        expect(sample.s).toBeLessThanOrEqual(1);
        expect(sample.c).toBeGreaterThanOrEqual(0);
        expect(sample.c).toBeLessThanOrEqual(1);
        for (const angle of [-0.85, 0, 0.15, 0.85]) {
          mapBirdSample(sample, angle, out);
          expect(out[0]).toBeGreaterThanOrEqual(-0.240001);
          expect(out[0]).toBeLessThanOrEqual(0.190001);
          expect(Math.abs(out[1])).toBeLessThanOrEqual(0.500001);
          expect(Math.abs(out[2])).toBeLessThanOrEqual(0.500001);
        }
      }
    }
  });
  it("pairs each bird with exactly one target even with coincident angles", () => {
    const birds = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: -1 }];
    const targets = [{ x: 2, y: 2 }, { x: 0, y: -1 }, { x: -2, y: 1 }, { x: 0, y: -1 }];
    expect([...pairByAngle(birds, targets)].sort()).toEqual([0, 1, 2, 3]);
    expect([...pairByAngle([], [])]).toEqual([]);
    expect(() => pairByAngle(birds, [])).toThrow(RangeError);
  });
});
