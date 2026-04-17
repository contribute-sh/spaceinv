import { describe, expect, it } from "vitest";
import { createBullet, deactivate, isOffscreen, updateBullet } from "../bullet";

describe("bullet", () => {
  it("advances position by velocity scaled by dt", () => {
    const bullet = createBullet({
      id: "player-shot",
      x: 32,
      y: 120,
      vy: -80,
      width: 4,
      height: 12,
      owner: "player"
    });

    const updatedBullet = updateBullet(bullet, 0.5);

    expect(updatedBullet).not.toBe(bullet);
    expect(updatedBullet.y).toBe(80);
    expect(bullet.y).toBe(120);
  });

  it("supports both upward and downward velocity", () => {
    const upwardBullet = createBullet({
      id: "upward-shot",
      x: 16,
      y: 50,
      vy: -30,
      width: 4,
      height: 8,
      owner: "player"
    });
    const downwardBullet = createBullet({
      id: "downward-shot",
      x: 16,
      y: 50,
      vy: 45,
      width: 4,
      height: 8,
      owner: "alien"
    });

    expect(updateBullet(upwardBullet, 2).y).toBe(-10);
    expect(updateBullet(downwardBullet, 2).y).toBe(140);
  });

  it("detects top and bottom offscreen transitions", () => {
    const topBullet = createBullet({
      id: "top-edge",
      x: 8,
      y: -9,
      vy: -1,
      width: 2,
      height: 10,
      owner: "player"
    });
    const bottomBullet = createBullet({
      id: "bottom-edge",
      x: 8,
      y: 99,
      vy: 1,
      width: 2,
      height: 10,
      owner: "alien"
    });
    const bounds = { top: 0, bottom: 100 };

    expect(isOffscreen(topBullet, bounds)).toBe(false);
    expect(isOffscreen(updateBullet(topBullet, 1), bounds)).toBe(true);
    expect(isOffscreen(bottomBullet, bounds)).toBe(false);
    expect(isOffscreen(updateBullet(bottomBullet, 1), bounds)).toBe(true);
  });

  it("deactivate flips alive to false", () => {
    const bullet = createBullet({
      id: "active-shot",
      x: 4,
      y: 24,
      vy: -12,
      width: 2,
      height: 6,
      owner: "player"
    });

    const inactiveBullet = deactivate(bullet);

    expect(inactiveBullet.alive).toBe(false);
    expect(bullet.alive).toBe(true);
  });
});
