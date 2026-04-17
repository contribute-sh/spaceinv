import { describe, expect, it, vi } from "vitest";

import type { ComponentId } from "../types";
import { World } from "../world";

type Position = {
  x: number;
  y: number;
};

type Health = {
  current: number;
  max: number;
};

const positionId = "position" as ComponentId<Position>;
const healthId = "health" as ComponentId<Health>;

describe("World", () => {
  it("createEntity returns unique ids", () => {
    const world = new World();
    const first = world.createEntity();
    const second = world.createEntity();

    expect(first).not.toBe(second);
    expect(world.entities.has(first)).toBe(true);
    expect(world.entities.has(second)).toBe(true);
  });

  it("destroyEntity removes the entity and its components", () => {
    const world = new World();
    const entity = world.createEntity();

    world.addComponent(entity, positionId, { x: 10, y: 20 });
    world.addComponent(entity, healthId, { current: 2, max: 3 });

    expect(world.components.get(positionId)?.has(entity)).toBe(true);
    expect(world.components.get(healthId)?.has(entity)).toBe(true);

    world.destroyEntity(entity);

    expect(world.entities.has(entity)).toBe(false);
    expect(world.getComponent(entity, positionId)).toBeUndefined();
    expect(world.getComponent(entity, healthId)).toBeUndefined();
    expect(world.hasComponent(entity, positionId)).toBe(false);
    expect(world.hasComponent(entity, healthId)).toBe(false);
    expect(world.components.get(positionId)?.has(entity) ?? false).toBe(false);
    expect(world.components.get(healthId)?.has(entity) ?? false).toBe(false);
  });

  it("addComponent and removeComponent round-trip data", () => {
    const world = new World();
    const entity = world.createEntity();
    const position = { x: 4, y: 8 };

    world.addComponent(entity, positionId, position);

    expect(world.getComponent(entity, positionId)).toEqual(position);

    world.removeComponent(entity, positionId);

    expect(world.getComponent(entity, positionId)).toBeUndefined();
  });

  it("hasComponent reflects current state", () => {
    const world = new World();
    const entity = world.createEntity();

    expect(world.hasComponent(entity, positionId)).toBe(false);

    world.addComponent(entity, positionId, { x: 1, y: 2 });

    expect(world.hasComponent(entity, positionId)).toBe(true);

    world.removeComponent(entity, positionId);

    expect(world.hasComponent(entity, positionId)).toBe(false);
  });

  it("reuses destroyed entity ids safely", () => {
    const world = new World();
    const first = world.createEntity();

    world.addComponent(first, positionId, { x: 3, y: 6 });
    world.destroyEntity(first);

    const reused = world.createEntity();

    expect(reused).toBe(first);
    expect(world.hasComponent(reused, positionId)).toBe(false);
    expect(world.getComponent(reused, positionId)).toBeUndefined();

    world.addComponent(reused, positionId, { x: 7, y: 9 });

    expect(world.getComponent(reused, positionId)).toEqual({ x: 7, y: 9 });
  });

  it("updates registered systems", () => {
    const world = new World();
    const update = vi.fn<(currentWorld: World, dt: number) => void>();

    world.registerSystem({ update });
    world.update(16);

    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(world, 16);
  });
});
