import { describe, expect, it } from "vitest";

import {
  componentStoreNames,
  type ComponentMap,
  type ComponentStoreName,
} from "../components";
import { createWorld } from "../world";

function expectComponentRoundTrip<Store extends ComponentStoreName>(
  store: Store,
  value: ComponentMap[Store],
): void {
  const world = createWorld();
  const entityId = world.createEntity();

  expect(world.hasComponent(entityId, store)).toBe(false);
  expect(world.getComponent(entityId, store)).toBeUndefined();

  world.addComponent(entityId, store, value);

  expect(world.hasComponent(entityId, store)).toBe(true);
  expect(world.getComponent(entityId, store)).toEqual(value);

  world.removeComponent(entityId, store);

  expect(world.hasComponent(entityId, store)).toBe(false);
  expect(world.getComponent(entityId, store)).toBeUndefined();
}

describe("world", () => {
  it("creates unique monotonic entity ids", () => {
    const world = createWorld();

    expect([
      world.createEntity(),
      world.createEntity(),
      world.createEntity(),
    ]).toEqual([0, 1, 2]);
  });

  it("purges destroyed entities from every component store", () => {
    const world = createWorld();
    const entityId = world.createEntity();

    world.addComponent(entityId, "position", { x: 10, y: 20 });
    world.addComponent(entityId, "velocity", { x: -2, y: 4 });
    world.addComponent(entityId, "sprite", {
      textureId: "player",
      width: 16,
      height: 12,
    });
    world.addComponent(entityId, "collider", { width: 14, height: 10 });
    world.addComponent(entityId, "health", { current: 3, max: 5 });

    expect(world.query(componentStoreNames)).toEqual([entityId]);

    world.destroyEntity(entityId);

    for (const storeName of componentStoreNames) {
      expect(world.stores[storeName].has(entityId)).toBe(false);
      expect(world.hasComponent(entityId, storeName)).toBe(false);
      expect(world.getComponent(entityId, storeName)).toBeUndefined();
    }

    expect(world.query(componentStoreNames)).toEqual([]);
    expect(world.query([])).toEqual([]);
  });

  it("round-trips position components", () => {
    expectComponentRoundTrip("position", { x: 4, y: 8 });
  });

  it("round-trips velocity components", () => {
    expectComponentRoundTrip("velocity", { x: -3, y: 6 });
  });

  it("round-trips sprite components", () => {
    expectComponentRoundTrip("sprite", {
      textureId: "alien",
      width: 24,
      height: 16,
    });
  });

  it("round-trips collider components", () => {
    expectComponentRoundTrip("collider", { width: 18, height: 9 });
  });

  it("round-trips health components", () => {
    expectComponentRoundTrip("health", { current: 2, max: 7 });
  });

  it("queries only entities that have every requested component store", () => {
    const world = createWorld();
    const entityA = world.createEntity();
    const entityB = world.createEntity();
    const entityC = world.createEntity();
    const entityD = world.createEntity();

    world.addComponent(entityD, "position", { x: 40, y: 50 });
    world.addComponent(entityD, "velocity", { x: 1, y: 1 });
    world.addComponent(entityD, "health", { current: 5, max: 5 });

    world.addComponent(entityB, "position", { x: 10, y: 20 });

    world.addComponent(entityA, "velocity", { x: -1, y: -1 });
    world.addComponent(entityA, "position", { x: 0, y: 0 });

    world.addComponent(entityC, "velocity", { x: 3, y: 7 });

    expect(world.query(["position", "velocity"])).toEqual([entityA, entityD]);
    expect(world.query(["position", "health"])).toEqual([entityD]);
    expect(world.query(["sprite"])).toEqual([]);
  });
});
