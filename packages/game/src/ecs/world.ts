import type { ComponentId, Entity } from "./types";

export interface WorldSystem {
  update(world: World, dt: number): void;
}

function toEntity(value: number): Entity {
  return value as Entity;
}

export class World {
  readonly entities = new Set<Entity>();
  readonly components = new Map<ComponentId<unknown>, Map<Entity, unknown>>();

  private readonly recycledEntities: Entity[] = [];
  private readonly systems = new Set<WorldSystem>();
  private nextEntityId = 0;

  createEntity(): Entity {
    const entity = this.recycledEntities.pop() ?? this.createFreshEntity();

    this.entities.add(entity);

    return entity;
  }

  destroyEntity(entity: Entity): void {
    if (!this.entities.delete(entity)) {
      return;
    }

    for (const [componentId, store] of this.components) {
      store.delete(entity);

      if (store.size === 0) {
        this.components.delete(componentId);
      }
    }

    this.recycledEntities.push(entity);
  }

  addComponent<T>(entity: Entity, id: ComponentId<T>, data: T): void {
    if (!this.entities.has(entity)) {
      return;
    }

    this.getOrCreateStore(id).set(entity, data);
  }

  getComponent<T>(entity: Entity, id: ComponentId<T>): T | undefined {
    if (!this.entities.has(entity)) {
      return undefined;
    }

    return this.getStore(id)?.get(entity);
  }

  removeComponent<T>(entity: Entity, id: ComponentId<T>): void {
    if (!this.entities.has(entity)) {
      return;
    }

    const store = this.getStore(id);

    if (!store) {
      return;
    }

    store.delete(entity);

    if (store.size === 0) {
      this.components.delete(id as ComponentId<unknown>);
    }
  }

  hasComponent<T>(entity: Entity, id: ComponentId<T>): boolean {
    if (!this.entities.has(entity)) {
      return false;
    }

    return this.getStore(id)?.has(entity) ?? false;
  }

  registerSystem(system: WorldSystem): void {
    this.systems.add(system);
  }

  update(dt: number): void {
    for (const system of this.systems) {
      system.update(this, dt);
    }
  }

  private createFreshEntity(): Entity {
    const entity = toEntity(this.nextEntityId);

    this.nextEntityId += 1;

    return entity;
  }

  private getStore<T>(id: ComponentId<T>): Map<Entity, T> | undefined {
    return this.components.get(id as ComponentId<unknown>) as
      | Map<Entity, T>
      | undefined;
  }

  private getOrCreateStore<T>(id: ComponentId<T>): Map<Entity, T> {
    const existingStore = this.getStore(id);

    if (existingStore) {
      return existingStore;
    }

    const store = new Map<Entity, T>();

    this.components.set(
      id as ComponentId<unknown>,
      store as Map<Entity, unknown>,
    );

    return store;
  }
}

export function createWorld(): World {
  return new World();
}
