import { describe, expect, it } from "vitest";

import { createFrameRng, createRng } from "../rng";

function sequence(rng: ReturnType<typeof createRng>, length: number): number[] {
  return Array.from({ length }, () => rng.next());
}

describe("rng", () => {
  it("produces identical sequences for the same seed", () => {
    expect(sequence(createRng(7), 8)).toEqual(sequence(createRng(7), 8));
  });

  it("produces different sequences for different seeds", () => {
    expect(sequence(createRng(7), 8)).not.toEqual(sequence(createRng(8), 8));
  });

  it("round-trips saved state so the sequence resumes exactly", () => {
    const rng = createRng(42);

    rng.next();
    rng.next();

    const savedState = rng.save();
    const expected = [rng.next(), rng.next(), rng.next()];

    rng.restore(savedState);

    expect([rng.next(), rng.next(), rng.next()]).toEqual(expected);
  });

  it("derives deterministic frame-seeded generators from the same inputs", () => {
    expect(sequence(createFrameRng(19, 240), 8)).toEqual(
      sequence(createFrameRng(19, 240), 8),
    );
    expect(sequence(createFrameRng(19, 240), 8)).not.toEqual(
      sequence(createFrameRng(19, 241), 8),
    );
  });

  it("keeps nextInt and nextRange values within their requested bounds", () => {
    const rng = createRng(99);

    for (let iteration = 0; iteration < 1000; iteration += 1) {
      const intValue = rng.nextInt(-3, 7);
      const rangeValue = rng.nextRange(-1.5, 2.5);

      expect(intValue).toBeGreaterThanOrEqual(-3);
      expect(intValue).toBeLessThan(7);
      expect(rangeValue).toBeGreaterThanOrEqual(-1.5);
      expect(rangeValue).toBeLessThan(2.5);
    }
  });
});
