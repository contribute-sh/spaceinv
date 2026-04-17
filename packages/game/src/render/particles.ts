const DEFAULT_COLOR = "#ffffff";
const DEFAULT_LIFETIME = 1;
const DEFAULT_SIZE = 2;

export interface Particle {
  active: boolean;
  age: number;
  alpha: number;
  ax: number;
  ay: number;
  color: string;
  lifetime: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

export interface SpawnParticleOptions {
  ax?: number;
  ay?: number;
  color?: string;
  lifetime?: number;
  size?: number;
  vx?: number;
  vy?: number;
}

interface PooledParticle extends Particle {
  sequence: number;
}

export class ParticleSystem {
  private activeParticleCount = 0;
  private nextSequence = 0;
  private readonly pool: PooledParticle[];

  constructor(capacity: number) {
    const normalizedCapacity = normalizeCapacity(capacity);

    this.pool = Array.from({ length: normalizedCapacity }, () =>
      createInactiveParticle(),
    );
  }

  get activeCount(): number {
    return this.activeParticleCount;
  }

  get particles(): readonly Particle[] {
    return this.pool;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const previousAlpha = ctx.globalAlpha;
    const previousFillStyle = ctx.fillStyle;

    for (const particle of this.pool) {
      if (!particle.active) {
        continue;
      }

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }

    ctx.globalAlpha = previousAlpha;
    ctx.fillStyle = previousFillStyle;
  }

  spawn(x: number, y: number, options: SpawnParticleOptions = {}): void {
    const slotIndex = this.findReusableSlotIndex();

    if (slotIndex < 0) {
      return;
    }

    const particle = this.pool[slotIndex];
    const wasActive = particle.active;

    particle.active = true;
    particle.age = 0;
    particle.alpha = 1;
    particle.ax = normalizeFiniteNumber(options.ax, 0);
    particle.ay = normalizeFiniteNumber(options.ay, 0);
    particle.color = normalizeColor(options.color);
    particle.lifetime = normalizePositiveNumber(
      options.lifetime,
      DEFAULT_LIFETIME,
    );
    particle.sequence = this.nextSequence;
    particle.size = normalizePositiveNumber(options.size, DEFAULT_SIZE);
    particle.vx = normalizeFiniteNumber(options.vx, 0);
    particle.vy = normalizeFiniteNumber(options.vy, 0);
    particle.x = x;
    particle.y = y;
    this.nextSequence += 1;

    if (!wasActive) {
      this.activeParticleCount += 1;
    }
  }

  update(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }

    for (const particle of this.pool) {
      if (!particle.active) {
        continue;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx += particle.ax * dt;
      particle.vy += particle.ay * dt;
      particle.age += dt;

      if (particle.age >= particle.lifetime) {
        particle.active = false;
        particle.alpha = 0;
        this.activeParticleCount -= 1;
        continue;
      }

      particle.alpha = 1 - particle.age / particle.lifetime;
    }
  }

  private findReusableSlotIndex(): number {
    let oldestActiveIndex = -1;
    let oldestSequence = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.pool.length; index += 1) {
      const particle = this.pool[index];

      if (!particle.active) {
        return index;
      }

      if (particle.sequence < oldestSequence) {
        oldestSequence = particle.sequence;
        oldestActiveIndex = index;
      }
    }

    return oldestActiveIndex;
  }
}

function createInactiveParticle(): PooledParticle {
  return {
    active: false,
    age: 0,
    alpha: 0,
    ax: 0,
    ay: 0,
    color: DEFAULT_COLOR,
    lifetime: DEFAULT_LIFETIME,
    sequence: -1,
    size: DEFAULT_SIZE,
    vx: 0,
    vy: 0,
    x: 0,
    y: 0,
  };
}

function normalizeCapacity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function normalizeColor(value: string | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_COLOR;
  }

  return value;
}

function normalizeFiniteNumber(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isFinite(value) ? value : fallback;
}

function normalizePositiveNumber(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
