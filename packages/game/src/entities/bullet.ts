export type BulletOwner = "player" | "alien";

export type Bullet = {
  id: string;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  alive: boolean;
  owner: BulletOwner;
};

export type CreateBulletOptions = Omit<Bullet, "alive"> & {
  alive?: boolean;
};

export type BulletBounds = {
  top: number;
  bottom: number;
};

export function createBullet(options: CreateBulletOptions): Bullet {
  const { alive = true, ...bullet } = options;

  return {
    ...bullet,
    alive
  };
}

export function updateBullet(bullet: Bullet, dt: number): Bullet {
  return {
    ...bullet,
    y: bullet.y + bullet.vy * dt
  };
}

export function deactivate(bullet: Bullet): Bullet {
  return {
    ...bullet,
    alive: false
  };
}

export function isOffscreen(bullet: Bullet, bounds: BulletBounds): boolean {
  return bullet.y + bullet.height <= bounds.top || bullet.y >= bounds.bottom;
}
