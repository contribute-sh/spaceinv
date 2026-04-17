import { describe, expect, it } from "vitest";

import { createAlien } from "../alien";

describe("createAlien", () => {
  it("creates an alive alien by default", () => {
    expect(createAlien()).toEqual({
      alive: true,
      type: "small",
      position: { x: 0, y: 0 }
    });
  });

  it("respects custom position and type", () => {
    const alien = createAlien({
      type: "large",
      position: { x: 12, y: 24 }
    });

    expect(alien.type).toBe("large");
    expect(alien.position).toEqual({ x: 12, y: 24 });
  });

  it("reflects when an alien is no longer alive", () => {
    const alien = createAlien();

    alien.alive = false;

    expect(alien.alive).toBe(false);
  });
});
