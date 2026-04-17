import { describe, expect, it } from "vitest";

import { createScore } from "../score";

describe("score store", () => {
  it("starts at zero", () => {
    const score = createScore();

    expect(score.getValue()).toBe(0);
  });

  it("accumulates added points", () => {
    const score = createScore();

    score.add(10);
    score.add(25);

    expect(score.getValue()).toBe(35);
  });

  it("resets back to zero", () => {
    const score = createScore();

    score.add(15);
    score.reset();

    expect(score.getValue()).toBe(0);
  });

  it("rejects negative point additions", () => {
    const score = createScore();

    expect(() => score.add(-5)).toThrowError(
      new RangeError("Score increments cannot be negative"),
    );
    expect(score.getValue()).toBe(0);
  });
});
