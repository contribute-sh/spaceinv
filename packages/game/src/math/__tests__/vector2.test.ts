import { describe, expect, it } from "vitest";

import { add, clamp, scale, sub } from "../vector2";

describe("vector2", () => {
  it("adds and subtracts component-wise", () => {
    const a = { x: 3, y: -4 };
    const b = { x: -1, y: 6 };

    expect(add(a, b)).toEqual({ x: 2, y: 2 });
    expect(sub(a, b)).toEqual({ x: 4, y: -10 });
  });

  it("scales component-wise, including negative scalars", () => {
    expect(scale({ x: 2, y: -3 }, 2.5)).toEqual({ x: 5, y: -7.5 });
    expect(scale({ x: 2, y: -3 }, -2)).toEqual({ x: -4, y: 6 });
  });

  it("clamps vectors already within bounds without changing either axis", () => {
    const min = { x: -2, y: 1 };
    const max = { x: 4, y: 6 };

    expect(clamp({ x: 1, y: 5 }, min, max)).toEqual({ x: 1, y: 5 });
  });

  it("clamps each axis independently when values fall outside the bounds", () => {
    const min = { x: -2, y: 1 };
    const max = { x: 4, y: 6 };

    expect(clamp({ x: -5, y: 4 }, min, max)).toEqual({ x: -2, y: 4 });
    expect(clamp({ x: 3, y: 9 }, min, max)).toEqual({ x: 3, y: 6 });
    expect(clamp({ x: 8, y: -3 }, min, max)).toEqual({ x: 4, y: 1 });
  });

  it("never mutates the input vectors", () => {
    const a = { x: 6, y: -2 };
    const b = { x: -4, y: 5 };
    const min = { x: 0, y: -1 };
    const max = { x: 4, y: 3 };

    const added = add(a, b);
    const subtracted = sub(a, b);
    const scaled = scale(a, 3);
    const clamped = clamp(a, min, max);

    expect(added).not.toBe(a);
    expect(added).not.toBe(b);
    expect(subtracted).not.toBe(a);
    expect(subtracted).not.toBe(b);
    expect(scaled).not.toBe(a);
    expect(clamped).not.toBe(a);

    expect(a).toEqual({ x: 6, y: -2 });
    expect(b).toEqual({ x: -4, y: 5 });
    expect(min).toEqual({ x: 0, y: -1 });
    expect(max).toEqual({ x: 4, y: 3 });
  });

  it("handles zero-vector edge cases", () => {
    const zero = { x: 0, y: 0 };

    expect(add(zero, zero)).toEqual(zero);
    expect(sub(zero, zero)).toEqual(zero);
    expect(scale(zero, 3)).toEqual(zero);
    expect(clamp(zero, { x: -1, y: -1 }, { x: 1, y: 1 })).toEqual(zero);
  });
});
