import { describe, expect, it } from "vitest";

import {
  contains,
  intersects,
  sweptIntersect,
  type AABB,
  type Vector2Like,
} from "../aabb";

function box(
  x: number,
  y: number,
  width: number,
  height: number,
): Readonly<AABB> {
  return { x, y, width, height };
}

function vector(x: number, y: number): Readonly<Vector2Like> {
  return { x, y };
}

describe("contains", () => {
  it("returns true for a point strictly inside the box", () => {
    expect(contains(box(2, 3, 4, 5), vector(4, 6))).toBe(true);
  });

  it("returns false for a point outside the box", () => {
    expect(contains(box(2, 3, 4, 5), vector(6.1, 6))).toBe(false);
  });

  it("treats points on the edge as contained", () => {
    expect(contains(box(2, 3, 4, 5), vector(2, 8))).toBe(true);
  });
});

describe("intersects", () => {
  it("returns true for overlapping boxes", () => {
    expect(intersects(box(0, 0, 4, 4), box(2, 1, 4, 4))).toBe(true);
  });

  it("treats edge-touching boxes as intersecting on the x axis", () => {
    expect(intersects(box(0, 0, 2, 2), box(2, 0, 3, 2))).toBe(true);
  });

  it("treats edge-touching boxes as intersecting on the y axis", () => {
    expect(intersects(box(0, 0, 2, 2), box(0, 2, 2, 3))).toBe(true);
  });

  it("returns false when boxes are separated on the x axis", () => {
    expect(intersects(box(0, 0, 2, 2), box(2.01, 0, 2, 2))).toBe(false);
  });

  it("returns false when boxes are separated on the y axis", () => {
    expect(intersects(box(0, 0, 2, 2), box(0, 2.01, 2, 2))).toBe(false);
  });

  it("handles zero-size boxes", () => {
    expect(intersects(box(1, 1, 0, 0), box(1, 1, 3, 3))).toBe(true);
    expect(intersects(box(1, 1, 0, 0), box(2, 2, 3, 3))).toBe(false);
  });
});

describe("sweptIntersect", () => {
  it("detects a head-on collision and reports the contact normal", () => {
    const result = sweptIntersect(
      box(0, 0, 2, 2),
      vector(4, 0),
      box(5, 0, 2, 2),
      vector(0, 0),
    );

    expect(result).toEqual({
      time: 0.75,
      normal: vector(-1, 0),
    });
  });

  it("returns null for parallel motion with no relative velocity", () => {
    const result = sweptIntersect(
      box(0, 0, 2, 2),
      vector(3, 0),
      box(5, 0, 2, 2),
      vector(3, 0),
    );

    expect(result).toBeNull();
  });

  it("returns null when the moving box misses", () => {
    const result = sweptIntersect(
      box(0, 0, 1, 1),
      vector(6, 0),
      box(4, 3, 2, 2),
      vector(0, 0),
    );

    expect(result).toBeNull();
  });

  it("detects tunneling at high velocity", () => {
    const result = sweptIntersect(
      box(0, 0, 1, 1),
      vector(20, 0),
      box(10, 0, 2, 2),
      vector(0, 0),
    );

    expect(result).not.toBeNull();
    expect(result?.time).toBeCloseTo(0.45);
    expect(result?.normal).toEqual(vector(-1, 0));
  });

  it("accounts for simultaneous motion using relative velocity", () => {
    const result = sweptIntersect(
      box(0, 0, 2, 2),
      vector(4, 0),
      box(6, 0, 2, 2),
      vector(-2, 0),
    );

    expect(result).not.toBeNull();
    expect(result?.time).toBeCloseTo(2 / 3);
    expect(result?.normal).toEqual(vector(-1, 0));
  });

  it("returns a zero-time collision for already overlapping boxes with zero velocity", () => {
    const result = sweptIntersect(
      box(1, 1, 0, 0),
      vector(0, 0),
      box(1, 1, 3, 3),
      vector(0, 0),
    );

    expect(result).toEqual({
      time: 0,
      normal: vector(0, 0),
    });
  });

  it("returns null when separated boxes have zero velocity", () => {
    const result = sweptIntersect(
      box(0, 0, 1, 1),
      vector(0, 0),
      box(3, 0, 1, 1),
      vector(0, 0),
    );

    expect(result).toBeNull();
  });
});
