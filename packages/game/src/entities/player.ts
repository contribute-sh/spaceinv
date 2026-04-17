export type Player = {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  fireCooldown: number;
};

export type CreatePlayerOptions = Omit<Player, "fireCooldown"> & {
  fireCooldown?: number;
};

export type PlayerDirection = -1 | 0 | 1;

export type PlayerBounds = {
  minX: number;
  maxX: number;
};

export function createPlayer(options: CreatePlayerOptions): Player {
  const { fireCooldown = 0, ...player } = options;

  return {
    ...player,
    fireCooldown
  };
}

export function movePlayer(
  player: Player,
  dt: number,
  direction: PlayerDirection,
  bounds: PlayerBounds
): Player {
  const maxX = Math.max(bounds.minX, bounds.maxX - player.width);
  const nextX = player.x + player.vx * direction * dt;

  return {
    ...player,
    x: Math.min(Math.max(nextX, bounds.minX), maxX)
  };
}

export function tickCooldown(player: Player, dt: number): Player {
  return {
    ...player,
    fireCooldown: Math.max(0, player.fireCooldown - dt)
  };
}

export function canFire(player: Player): boolean {
  return player.fireCooldown === 0;
}

export function markFired(player: Player, fireIntervalMs: number): Player {
  return {
    ...player,
    fireCooldown: fireIntervalMs
  };
}
