export type UfoDirection = -1 | 1;

export interface UfoPosition {
  x: number;
  y: number;
}

export interface UfoVelocity {
  x: number;
  y: number;
}

export interface Ufo {
  active: boolean;
  bonusScore: number;
  direction: UfoDirection;
  position: UfoPosition;
  velocity: UfoVelocity;
}

export interface UfoBounds {
  left: number;
  right: number;
  y: number;
}

export interface UfoHitPayload {
  score: number;
}

export interface CreateUfoSpawnerOptions {
  bonusScores: ReadonlyArray<number>;
  bounds: UfoBounds;
  maxInterval: number;
  minInterval: number;
  onExit?: (ufo: Ufo) => void;
  rng: () => number;
  speed: number;
}

export interface UfoSpawner {
  getActiveUfo(): Ufo | null;
  onHit(): UfoHitPayload | null;
  update(dt: number): void;
}

export function createUfoSpawner(options: CreateUfoSpawnerOptions): UfoSpawner {
  const left = Math.min(options.bounds.left, options.bounds.right);
  const right = Math.max(options.bounds.left, options.bounds.right);
  const minInterval = Math.min(options.minInterval, options.maxInterval);
  const maxInterval = Math.max(options.minInterval, options.maxInterval);
  const speed = Math.abs(options.speed);
  const bonusScores =
    options.bonusScores.length > 0 ? [...options.bonusScores] : [0];

  let countdown = createCountdown();
  let activeUfo: Ufo | null = null;

  function createCountdown(): number {
    if (minInterval === maxInterval) {
      return minInterval;
    }

    const random = clampRandom(options.rng());

    return minInterval + random * (maxInterval - minInterval);
  }

  function createUfo(): Ufo {
    const direction = clampRandom(options.rng()) < 0.5 ? 1 : -1;
    const bonusScore =
      bonusScores[pickIndex(clampRandom(options.rng()), bonusScores.length)];

    return {
      active: true,
      bonusScore,
      direction,
      position: {
        x: direction === 1 ? left : right,
        y: options.bounds.y,
      },
      velocity: {
        x: speed * direction,
        y: 0,
      },
    };
  }

  function clearActiveUfo(ufo: Ufo): Ufo {
    const inactiveUfo = {
      ...ufo,
      active: false,
    };

    activeUfo = null;
    countdown = createCountdown();

    return inactiveUfo;
  }

  return {
    getActiveUfo(): Ufo | null {
      return activeUfo;
    },
    onHit(): UfoHitPayload | null {
      if (activeUfo === null) {
        return null;
      }

      const hitUfo = clearActiveUfo(activeUfo);

      return {
        score: hitUfo.bonusScore,
      };
    },
    update(dt: number): void {
      if (activeUfo === null) {
        countdown -= dt;

        if (countdown <= 0) {
          activeUfo = createUfo();
        }

        return;
      }

      const nextUfo: Ufo = {
        ...activeUfo,
        position: {
          x: activeUfo.position.x + activeUfo.velocity.x * dt,
          y: activeUfo.position.y + activeUfo.velocity.y * dt,
        },
      };

      if (hasExitedBounds(nextUfo, left, right)) {
        const exitedUfo = clearActiveUfo(nextUfo);

        options.onExit?.(exitedUfo);

        return;
      }

      activeUfo = nextUfo;
    },
  };
}

function hasExitedBounds(ufo: Ufo, left: number, right: number): boolean {
  return ufo.position.x < left || ufo.position.x > right;
}

function pickIndex(random: number, length: number): number {
  return Math.min(length - 1, Math.floor(random * length));
}

function clampRandom(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
