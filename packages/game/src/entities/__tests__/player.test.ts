import { describe, expect, it } from "vitest";

import {
  canFire,
  createPlayer,
  markFired,
  movePlayer,
  tickCooldown
} from "../player";

describe("player", () => {
  it("moves in both directions using velocity scaled by dt", () => {
    const player = createPlayer({
      x: 40,
      y: 96,
      vx: 24,
      width: 12,
      height: 8
    });
    const bounds = { minX: 0, maxX: 120 };

    const movedLeft = movePlayer(player, 0.5, -1, bounds);
    const movedRight = movePlayer(player, 0.5, 1, bounds);

    expect(movedLeft).not.toBe(player);
    expect(movedLeft.x).toBe(28);
    expect(movedRight.x).toBe(52);
    expect(player.x).toBe(40);
  });

  it("clamps movement at the left bound", () => {
    const player = createPlayer({
      x: 6,
      y: 96,
      vx: 12,
      width: 12,
      height: 8
    });

    const movedPlayer = movePlayer(player, 1, -1, { minX: 0, maxX: 120 });

    expect(movedPlayer.x).toBe(0);
  });

  it("clamps movement at the right bound", () => {
    const player = createPlayer({
      x: 100,
      y: 96,
      vx: 12,
      width: 16,
      height: 8
    });

    const movedPlayer = movePlayer(player, 1, 1, { minX: 0, maxX: 120 });

    expect(movedPlayer.x).toBe(104);
  });

  it("decrements cooldown by dt without going below zero", () => {
    const player = createPlayer({
      x: 40,
      y: 96,
      vx: 24,
      width: 12,
      height: 8,
      fireCooldown: 120
    });

    const tickingPlayer = tickCooldown(player, 20);
    const cooledPlayer = tickCooldown(player, 200);

    expect(tickingPlayer.fireCooldown).toBe(100);
    expect(cooledPlayer.fireCooldown).toBe(0);
    expect(player.fireCooldown).toBe(120);
  });

  it("cannot fire until the cooldown has elapsed", () => {
    const player = createPlayer({
      x: 40,
      y: 96,
      vx: 24,
      width: 12,
      height: 8
    });

    const firingPlayer = markFired(player, 100);

    expect(canFire(firingPlayer)).toBe(false);
    expect(canFire(tickCooldown(firingPlayer, 99))).toBe(false);
    expect(canFire(tickCooldown(firingPlayer, 100))).toBe(true);
  });

  it("resets the cooldown to the configured fire interval when fired", () => {
    const player = createPlayer({
      x: 40,
      y: 96,
      vx: 24,
      width: 12,
      height: 8,
      fireCooldown: 10
    });

    const firingPlayer = markFired(player, 150);

    expect(firingPlayer.fireCooldown).toBe(150);
    expect(player.fireCooldown).toBe(10);
  });
});
