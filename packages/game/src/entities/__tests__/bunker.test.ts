import { describe, expect, it } from "vitest";

import { Bunker } from "../bunker";

describe("Bunker", () => {
  it("starts with every cell intact", () => {
    const bunker = new Bunker(10, 20, 4, 3, 8);

    for (let row = 0; row < bunker.rows; row += 1) {
      for (let col = 0; col < bunker.cols; col += 1) {
        expect(bunker.isIntact(col, row)).toBe(true);
      }
    }
  });

  it("destroys cells whose centers fall inside the damage radius", () => {
    const bunker = new Bunker(0, 0, 4, 4, 10);

    bunker.damage(10, 10, 8);

    expect(bunker.isIntact(0, 0)).toBe(false);
    expect(bunker.isIntact(1, 0)).toBe(false);
    expect(bunker.isIntact(0, 1)).toBe(false);
    expect(bunker.isIntact(1, 1)).toBe(false);
    expect(bunker.isIntact(2, 1)).toBe(true);
    expect(bunker.isIntact(1, 2)).toBe(true);
    expect(bunker.isIntact(3, 3)).toBe(true);
  });

  it("handles impacts at the bunker boundaries without affecting out-of-range cells", () => {
    const bunker = new Bunker(10, 20, 3, 3, 10);

    bunker.damage(10, 20, 8);
    bunker.damage(40, 50, 8);

    expect(bunker.isIntact(0, 0)).toBe(false);
    expect(bunker.isIntact(2, 2)).toBe(false);
    expect(bunker.isIntact(1, 0)).toBe(true);
    expect(bunker.isIntact(0, 1)).toBe(true);
    expect(bunker.isIntact(1, 2)).toBe(true);
    expect(bunker.isIntact(2, 1)).toBe(true);
  });

  it("is idempotent when damaging already-destroyed cells", () => {
    const bunker = new Bunker(0, 0, 3, 3, 10);

    bunker.damage(5, 5, 5);
    const firstPass = bunker.isIntact(0, 0);

    bunker.damage(5, 5, 5);

    expect(firstPass).toBe(false);
    expect(bunker.isIntact(0, 0)).toBe(false);
    expect(bunker.isIntact(1, 1)).toBe(true);
  });

  it("exposes a bbox derived from position and dimensions", () => {
    const bunker = new Bunker(12, 34, 5, 2, 6);

    expect(bunker.bbox).toEqual({
      x: 12,
      y: 34,
      width: 30,
      height: 12,
    });
  });

  it("returns world-space bounding boxes for corner and interior cells", () => {
    const bunker = new Bunker(100, 200, 4, 3, 7);

    expect(bunker.cellBBox(0, 0)).toEqual({
      x: 100,
      y: 200,
      width: 7,
      height: 7,
    });
    expect(bunker.cellBBox(2, 1)).toEqual({
      x: 114,
      y: 207,
      width: 7,
      height: 7,
    });
    expect(bunker.cellBBox(3, 2)).toEqual({
      x: 121,
      y: 214,
      width: 7,
      height: 7,
    });
  });
});
