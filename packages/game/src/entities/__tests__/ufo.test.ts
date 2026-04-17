import { describe, expect, it } from "vitest";

import { createUfoSpawner, type UfoSpawner } from "../ufo";

function createStubRng(...values: number[]): () => number {
  let index = 0;

  return (): number => {
    const value = values[Math.min(index, values.length - 1)] ?? 0;

    index += 1;

    return value;
  };
}

function getActiveUfo(spawner: UfoSpawner) {
  const ufo = spawner.getActiveUfo();

  expect(ufo).not.toBeNull();

  if (ufo === null) {
    throw new Error("Expected an active UFO");
  }

  return ufo;
}

describe("ufo", () => {
  it("spawns once the countdown reaches the configured interval", () => {
    const spawner = createUfoSpawner({
      bonusScores: [50, 100],
      bounds: { left: 0, right: 100, y: 24 },
      maxInterval: 4,
      minInterval: 2,
      rng: createStubRng(0, 0, 0),
      speed: 40,
    });

    expect(spawner.getActiveUfo()).toBeNull();

    spawner.update(1.5);

    expect(spawner.getActiveUfo()).toBeNull();

    spawner.update(0.5);

    expect(getActiveUfo(spawner)).toMatchObject({
      active: true,
      bonusScore: 50,
      direction: 1,
      position: { x: 0, y: 24 },
      velocity: { x: 40, y: 0 },
    });
  });

  it("deactivates after crossing the right bound and fires onExit once", () => {
    const exitedUfos: unknown[] = [];
    const spawner = createUfoSpawner({
      bonusScores: [150],
      bounds: { left: 0, right: 10, y: 12 },
      maxInterval: 1,
      minInterval: 1,
      onExit: (ufo) => {
        exitedUfos.push(ufo);
      },
      rng: createStubRng(0, 0),
      speed: 4,
    });

    spawner.update(1);

    expect(getActiveUfo(spawner).position.x).toBe(0);

    spawner.update(3);
    spawner.update(0.5);

    expect(spawner.getActiveUfo()).toBeNull();
    expect(exitedUfos).toHaveLength(1);
    expect(exitedUfos[0]).toMatchObject({
      active: false,
      bonusScore: 150,
      direction: 1,
      position: { x: 12, y: 12 },
      velocity: { x: 4, y: 0 },
    });
  });

  it("returns a bonus payload on hit and clears the active UFO", () => {
    const spawner = createUfoSpawner({
      bonusScores: [50, 100, 150],
      bounds: { left: 0, right: 120, y: 8 },
      maxInterval: 1,
      minInterval: 1,
      rng: createStubRng(0.25, 0.9),
      speed: 30,
    });

    expect(spawner.onHit()).toBeNull();

    spawner.update(1);

    expect(getActiveUfo(spawner).bonusScore).toBe(150);
    expect(spawner.onHit()).toEqual({ score: 150 });
    expect(spawner.getActiveUfo()).toBeNull();
    expect(spawner.onHit()).toBeNull();
  });

  it("does not spawn a second UFO while one is still active", () => {
    const spawner = createUfoSpawner({
      bonusScores: [200],
      bounds: { left: 0, right: 100, y: 16 },
      maxInterval: 1,
      minInterval: 1,
      rng: createStubRng(0.25, 0.75),
      speed: 10,
    });

    spawner.update(1);

    expect(getActiveUfo(spawner)).toMatchObject({
      direction: 1,
      position: { x: 0, y: 16 },
    });

    spawner.update(1);

    expect(getActiveUfo(spawner)).toMatchObject({
      direction: 1,
      position: { x: 10, y: 16 },
    });
  });

  it("spawns from alternating sides based on rng output", () => {
    const spawner = createUfoSpawner({
      bonusScores: [300],
      bounds: { left: -10, right: 10, y: 20 },
      maxInterval: 1,
      minInterval: 1,
      rng: createStubRng(0.25, 0.75),
      speed: 25,
    });

    spawner.update(1);

    expect(getActiveUfo(spawner)).toMatchObject({
      direction: 1,
      position: { x: -10, y: 20 },
      velocity: { x: 25, y: 0 },
    });

    spawner.update(1);

    expect(spawner.getActiveUfo()).toBeNull();

    spawner.update(1);

    expect(getActiveUfo(spawner)).toMatchObject({
      direction: -1,
      position: { x: 10, y: 20 },
      velocity: { x: -25, y: 0 },
    });
  });
});
