declare const entityBrand: unique symbol;
declare const componentIdBrand: unique symbol;

export type Entity = number & {
  readonly [entityBrand]: "Entity";
};

export type ComponentId<T> = string & {
  readonly [componentIdBrand]: T;
};

export interface Component<T> {
  readonly id: ComponentId<T>;
}
