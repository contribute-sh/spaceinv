export type AlienType = "small" | "medium" | "large";

export interface AlienPosition {
  x: number;
  y: number;
}

export interface Alien {
  alive: boolean;
  type: AlienType;
  position: AlienPosition;
}

export interface CreateAlienOptions {
  alive?: boolean;
  type?: AlienType;
  position?: AlienPosition;
}

const DEFAULT_ALIEN_TYPE: AlienType = "small";
const DEFAULT_ALIEN_POSITION: AlienPosition = { x: 0, y: 0 };

export function createAlien(options: CreateAlienOptions = {}): Alien {
  const {
    alive = true,
    type = DEFAULT_ALIEN_TYPE,
    position = DEFAULT_ALIEN_POSITION
  } = options;

  return {
    alive,
    type,
    position: {
      x: position.x,
      y: position.y
    }
  };
}
