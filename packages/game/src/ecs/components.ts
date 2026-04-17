export type Position = {
  x: number;
  y: number;
};

export type Velocity = {
  x: number;
  y: number;
};

export type Sprite = {
  textureId: string;
  width: number;
  height: number;
};

export type Collider = {
  width: number;
  height: number;
};

export type Health = {
  current: number;
  max: number;
};

export const componentStoreNames = [
  "position",
  "velocity",
  "sprite",
  "collider",
  "health",
] as const;

export type ComponentStoreName = (typeof componentStoreNames)[number];

export type ComponentMap = {
  position: Position;
  velocity: Velocity;
  sprite: Sprite;
  collider: Collider;
  health: Health;
};
