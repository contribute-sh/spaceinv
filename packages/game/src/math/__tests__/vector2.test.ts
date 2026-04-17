import { describe, expect, it } from "vitest";

import {
  add,
  dot,
  len,
  lenSq,
  normalize,
  scale,
  sub,
  vec,
  zero
} from "../vector2";

describe("vector2", () => {
  it("adds and subtracts component-wise", () => {
    const a = vec(3, -4);
    const b = vec(-1, 6);

    expect(add(a, b)).toEqual({ x: 2, y: 2 });
    expect(sub(a, b)).toEqual({ x: 4, y: -10 });
  });

  it("scales vectors by positive, negative, and zero scalars", () => {
    const value = vec(2, -3);

    expect(scale(value, 2.5)).toEqual({ x: 5, y: -7.5 });
    expect(scale(value, -2)).toEqual({ x: -4, y: 6 });
    expect(scale(value, 0)).toEqual({ x: 0, y: 0 });
  });

  it("computes squared length and length", () => {
    const value = vec(3, 4);

    expect(lenSq(value)).toBe(25);
    expect(len(value)).toBe(5);
  });

  it("normalizes non-zero vectors to unit length", () => {
    const normalized = normalize(vec(3, 4));

    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
    expect(len(normalized)).toBeCloseTo(1);
  });

  it("normalizes the zero vector to the zero vector", () => {
    expect(normalize(zero())).toEqual({ x: 0, y: 0 });
  });

  it("computes dot products for orthogonal and parallel vectors", () => {
    expect(dot(vec(1, 0), vec(0, 1))).toBe(0);
    expect(dot(vec(2, 3), vec(4, 6))).toBe(26);
  });

  it("constructs fresh vectors without mutating inputs", () => {
    const a = vec(6, -2);
    const b = vec(-4, 5);

    const origin = zero();
    const added = add(a, b);
    const normalized = normalize(a);

    expect(origin).toEqual({ x: 0, y: 0 });
    expect(origin).not.toBe(zero());

    expect(added).not.toBe(a);
    expect(added).not.toBe(b);
    expect(normalized).not.toBe(a);

    expect(a).toEqual({ x: 6, y: -2 });
    expect(b).toEqual({ x: -4, y: 5 });
  });
});
