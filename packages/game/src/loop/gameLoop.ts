const DEFAULT_STEP = 1 / 60;
const DEFAULT_MAX_FRAME_TIME = 0.25;

export interface GameLoopOptions {
  update: (dt: number) => void;
  render: (alpha: number) => void;
  step?: number;
  maxFrameTime?: number;
  now?: () => number;
  raf?: (cb: (t: number) => void) => number;
  cancelRaf?: (id: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizePositiveNumber(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function defaultNow(): number {
  return performance.now();
}

function defaultRaf(callback: (t: number) => void): number {
  return requestAnimationFrame(callback);
}

function defaultCancelRaf(id: number): void {
  cancelAnimationFrame(id);
}

export class GameLoop {
  private accumulator = 0;
  private frameId: number | null = null;
  private lastNow = 0;
  private running = false;
  private readonly tick: (t: number) => void;
  private readonly stepEpsilon: number;

  private readonly update: (dt: number) => void;
  private readonly render: (alpha: number) => void;
  private readonly step: number;
  private readonly maxFrameTime: number;
  private readonly now: () => number;
  private readonly raf: (cb: (t: number) => void) => number;
  private readonly cancelRaf: (id: number) => void;

  constructor(options: GameLoopOptions) {
    this.update = options.update;
    this.render = options.render;
    this.step = normalizePositiveNumber(options.step, DEFAULT_STEP);
    this.maxFrameTime = normalizePositiveNumber(
      options.maxFrameTime,
      DEFAULT_MAX_FRAME_TIME,
    );
    this.now = options.now ?? defaultNow;
    this.raf = options.raf ?? defaultRaf;
    this.cancelRaf = options.cancelRaf ?? defaultCancelRaf;
    this.stepEpsilon = this.step / 1_000_000;
    this.tick = (): void => {
      this.runFrame();
    };
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.accumulator = 0;
    this.lastNow = this.now();
    this.frameId = this.raf(this.tick);
  }

  stop(): void {
    this.running = false;
    this.accumulator = 0;
    this.lastNow = 0;

    if (this.frameId !== null) {
      this.cancelRaf(this.frameId);
      this.frameId = null;
    }
  }

  private runFrame(): void {
    if (!this.running) {
      return;
    }

    const currentNow = this.now();
    const frameTime = clamp(
      (currentNow - this.lastNow) / 1000,
      0,
      this.maxFrameTime,
    );

    this.lastNow = currentNow;
    this.accumulator += frameTime;

    while (this.accumulator + this.stepEpsilon >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;

      if (this.accumulator < this.stepEpsilon) {
        this.accumulator = 0;
      }

      if (!this.running) {
        this.frameId = null;
        return;
      }
    }

    this.render(clamp(this.accumulator / this.step, 0, 1 - Number.EPSILON));

    if (!this.running) {
      this.frameId = null;
      return;
    }

    this.frameId = this.raf(this.tick);
  }
}
