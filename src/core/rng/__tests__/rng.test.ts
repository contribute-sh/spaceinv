import { describe, expect, it } from "vitest";

import { Rng } from "../Rng";

function takeNext(rng: Rng, count: number): number[] {
  return Array.from({ length: count }, () => rng.next());
}

describe("Rng", () => {
  it("produces identical sequences for the same seed", () => {
    const left = new Rng(123_456_789);
    const right = new Rng(123_456_789);

    expect(takeNext(left, 8)).toEqual(takeNext(right, 8));
  });

  it("produces different sequences for different seeds", () => {
    const left = new Rng(123_456_789);
    const right = new Rng(987_654_321);

    expect(takeNext(left, 8)).not.toEqual(takeNext(right, 8));
  });

  it("keeps nextFloat within [0, 1)", () => {
    const rng = new Rng(42);

    for (let index = 0; index < 1_000; index += 1) {
      const value = rng.nextFloat();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("returns bounded integers from nextInt", () => {
    const rng = new Rng(99);
    const seen = new Set<number>();

    for (let index = 0; index < 1_000; index += 1) {
      const value = rng.nextInt(-1, 1);

      seen.add(value);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }

    expect(Array.from(seen).sort((left, right) => left - right)).toEqual([
      -1, 0, 1,
    ]);
  });

  it("keeps nextRange within [min, max)", () => {
    const rng = new Rng(7);

    for (let index = 0; index < 1_000; index += 1) {
      const value = rng.nextRange(-2.5, 3.75);

      expect(value).toBeGreaterThanOrEqual(-2.5);
      expect(value).toBeLessThan(3.75);
    }
  });
});
