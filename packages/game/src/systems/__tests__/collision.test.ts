import { describe, expect, it } from "vitest";

import {
  detectCollisions,
  intersects,
  type CollisionAlien,
  type CollisionBullet,
  type CollisionPlayer,
} from "../collision";

describe("collision", () => {
  it("returns false for non-overlapping boxes", () => {
    expect(
      intersects(
        { x: 0, y: 0, width: 8, height: 8 },
        { x: 12, y: 12, width: 4, height: 4 },
      ),
    ).toBe(false);
  });

  it("treats edge-touching boxes as non-intersecting", () => {
    expect(
      intersects(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 2, width: 4, height: 4 },
      ),
    ).toBe(false);
  });

  it("returns true for fully overlapping boxes", () => {
    expect(
      intersects(
        { x: 5, y: 5, width: 10, height: 10 },
        { x: 7, y: 7, width: 2, height: 2 },
      ),
    ).toBe(true);
  });

  it("finds multiple bullet-vs-alien collisions", () => {
    const bullets: CollisionBullet[] = [
      { alive: true, owner: "player", x: 2, y: 2, width: 2, height: 6 },
      { alive: true, owner: "player", x: 22, y: 2, width: 2, height: 6 },
      { alive: true, owner: "alien", x: 42, y: 2, width: 2, height: 6 },
    ];
    const aliens: CollisionAlien[] = [
      { alive: true, x: 0, y: 0, width: 10, height: 10 },
      { alive: true, x: 20, y: 0, width: 10, height: 10 },
      { alive: false, x: 40, y: 0, width: 10, height: 10 },
    ];
    const player: CollisionPlayer = {
      alive: true,
      x: 80,
      y: 80,
      width: 12,
      height: 12,
    };

    expect(detectCollisions(bullets, aliens, player)).toEqual({
      bulletVsAlien: [
        { type: "bullet-vs-alien", bullet: bullets[0], alien: aliens[0] },
        { type: "bullet-vs-alien", bullet: bullets[1], alien: aliens[1] },
      ],
      bulletVsPlayer: [],
    });
  });

  it("detects bullet-vs-player collisions", () => {
    const bullets: CollisionBullet[] = [
      { alive: true, owner: "alien", x: 10, y: 12, width: 3, height: 3 },
      { alive: false, owner: "alien", x: 11, y: 11, width: 3, height: 3 },
      { alive: true, owner: "player", x: 9, y: 9, width: 3, height: 3 },
    ];
    const player: CollisionPlayer = {
      alive: true,
      x: 8,
      y: 8,
      width: 10,
      height: 10,
    };

    expect(detectCollisions(bullets, [], player)).toEqual({
      bulletVsAlien: [],
      bulletVsPlayer: [
        { type: "bullet-vs-player", bullet: bullets[0], player },
      ],
    });
  });
});
