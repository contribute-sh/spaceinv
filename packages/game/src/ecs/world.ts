import {
  componentStoreNames,
  type ComponentMap,
  type ComponentStoreName,
} from "./components";

export type EntityId = number;

export type ComponentStores = {
  [Store in ComponentStoreName]: Map<EntityId, ComponentMap[Store]>;
};

export type World = {
  readonly stores: ComponentStores;
  createEntity(): EntityId;
  destroyEntity(id: EntityId): void;
  addComponent<Store extends ComponentStoreName>(
    id: EntityId,
    store: Store,
    value: ComponentMap[Store],
  ): void;
  removeComponent<Store extends ComponentStoreName>(
    id: EntityId,
    store: Store,
  ): void;
  getComponent<Store extends ComponentStoreName>(
    id: EntityId,
    store: Store,
  ): ComponentMap[Store] | undefined;
  hasComponent<Store extends ComponentStoreName>(
    id: EntityId,
    store: Store,
  ): boolean;
  query(stores: ReadonlyArray<ComponentStoreName>): EntityId[];
};

export function createWorld(): World {
  const stores: ComponentStores = {
    position: new Map<EntityId, ComponentMap["position"]>(),
    velocity: new Map<EntityId, ComponentMap["velocity"]>(),
    sprite: new Map<EntityId, ComponentMap["sprite"]>(),
    collider: new Map<EntityId, ComponentMap["collider"]>(),
    health: new Map<EntityId, ComponentMap["health"]>(),
  };
  const entities = new Set<EntityId>();
  let nextEntityId = 0;

  return {
    stores,
    createEntity(): EntityId {
      const entityId = nextEntityId;

      nextEntityId += 1;
      entities.add(entityId);

      return entityId;
    },
    destroyEntity(id: EntityId): void {
      entities.delete(id);

      for (const storeName of componentStoreNames) {
        stores[storeName].delete(id);
      }
    },
    addComponent<Store extends ComponentStoreName>(
      id: EntityId,
      store: Store,
      value: ComponentMap[Store],
    ): void {
      if (!entities.has(id)) {
        return;
      }

      stores[store].set(id, value);
    },
    removeComponent<Store extends ComponentStoreName>(
      id: EntityId,
      store: Store,
    ): void {
      if (!entities.has(id)) {
        return;
      }

      stores[store].delete(id);
    },
    getComponent<Store extends ComponentStoreName>(
      id: EntityId,
      store: Store,
    ): ComponentMap[Store] | undefined {
      if (!entities.has(id)) {
        return undefined;
      }

      return stores[store].get(id);
    },
    hasComponent<Store extends ComponentStoreName>(
      id: EntityId,
      store: Store,
    ): boolean {
      if (!entities.has(id)) {
        return false;
      }

      return stores[store].has(id);
    },
    query(storeNames: ReadonlyArray<ComponentStoreName>): EntityId[] {
      if (storeNames.length === 0) {
        return [...entities].sort((left, right) => left - right);
      }

      const [firstStore, ...remainingStores] = storeNames;
      const entityIds: EntityId[] = [];

      for (const entityId of stores[firstStore].keys()) {
        if (!entities.has(entityId)) {
          continue;
        }

        let matches = true;

        for (const storeName of remainingStores) {
          if (!stores[storeName].has(entityId)) {
            matches = false;
            break;
          }
        }

        if (matches) {
          entityIds.push(entityId);
        }
      }

      return entityIds.sort((left, right) => left - right);
    },
  };
}
