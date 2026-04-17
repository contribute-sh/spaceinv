export const GameConfig = Object.freeze({
  resolution: Object.freeze({
    logicalWidth: 224,
    logicalHeight: 256,
  } as const),
  timestep: Object.freeze({
    fixedDeltaSeconds: 1 / 60,
  } as const),
  player: Object.freeze({
    speed: 90,
    fireCooldownSeconds: 0.35,
    maxBullets: 1,
    lives: 3,
  } as const),
  bullet: Object.freeze({
    speed: 180,
    width: 2,
    height: 8,
  } as const),
  alien: Object.freeze({
    baseSpeed: 12,
    descendStep: 8,
    fireChancePerSecond: 0.3,
  } as const),
  grid: Object.freeze({
    rows: 5,
    cols: 11,
    horizontalSpacing: 16,
    verticalSpacing: 16,
    marginX: 16,
    marginY: 24,
  } as const),
  scoring: Object.freeze({
    pointsPerAlien: 10,
    bonusUfo: 100,
    extraLifeThreshold: 1000,
  } as const),
} as const);

export type GameConfig = typeof GameConfig;
