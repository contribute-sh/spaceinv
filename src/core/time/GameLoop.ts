const DEFAULT_FIXED_DT = 1 / 60;
const DEFAULT_MAX_FRAME_DELTA = 0.25;

export type GameLoopUpdate = (dt: number) => void;
export type GameLoopRender = (alpha: number) => void;
export type GameLoopClock = () => number;
export type GameLoopCancel = () => void;
export type GameLoopScheduler = (callback: () => void) => GameLoopCancel;

export type GameLoopOptions = {
  update: GameLoopUpdate;
  render: GameLoopRender;
  fixedDt?: number;
  maxFrameDelta?: number;
  now?: GameLoopClock;
  schedule?: GameLoopScheduler;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizePositiveNumber(
  value: number | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function defaultNow(): number {
  return globalThis.performance.now();
}

function defaultSchedule(callback: () => void): GameLoopCancel {
  if (
    typeof globalThis.requestAnimationFrame !== "function" ||
    typeof globalThis.cancelAnimationFrame !== "function"
  ) {
    throw new Error(
      "GameLoop default scheduler requires requestAnimationFrame support.",
    );
  }

  const frameId = globalThis.requestAnimationFrame(() => {
    callback();
  });

  return (): void => {
    globalThis.cancelAnimationFrame(frameId);
  };
}

export class GameLoop {
  private accumulator = 0;
  private lastNow = 0;
  private running = false;
  private cancelScheduled: GameLoopCancel | null = null;
  private readonly fixedDtEpsilon: number;

  private readonly update: GameLoopUpdate;
  private readonly render: GameLoopRender;
  private readonly fixedDt: number;
  private readonly maxFrameDelta: number;
  private readonly now: GameLoopClock;
  private readonly schedule: GameLoopScheduler;

  public constructor(options: GameLoopOptions) {
    this.update = options.update;
    this.render = options.render;
    this.fixedDt = normalizePositiveNumber(options.fixedDt, DEFAULT_FIXED_DT);
    this.maxFrameDelta = normalizePositiveNumber(
      options.maxFrameDelta,
      DEFAULT_MAX_FRAME_DELTA,
    );
    this.now = options.now ?? defaultNow;
    this.schedule = options.schedule ?? defaultSchedule;
    this.fixedDtEpsilon = this.fixedDt / 1_000_000;
  }

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.accumulator = 0;
    this.lastNow = this.now();
    this.scheduleNextFrame();
  }

  public stop(): void {
    this.running = false;
    this.accumulator = 0;
    this.lastNow = 0;

    if (this.cancelScheduled) {
      this.cancelScheduled();
      this.cancelScheduled = null;
    }
  }

  private readonly tick = (): void => {
    this.runFrame();
  };

  private scheduleNextFrame(): void {
    this.cancelScheduled = this.schedule(this.tick);
  }

  private runFrame(): void {
    if (!this.running) {
      return;
    }

    this.cancelScheduled = null;

    const currentNow = this.now();
    const frameDelta = clamp(
      (currentNow - this.lastNow) / 1000,
      0,
      this.maxFrameDelta,
    );

    this.lastNow = currentNow;
    this.accumulator += frameDelta;

    while (this.accumulator + this.fixedDtEpsilon >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;

      if (this.accumulator < this.fixedDtEpsilon) {
        this.accumulator = 0;
      }

      if (!this.running) {
        return;
      }
    }

    this.render(clamp(this.accumulator / this.fixedDt, 0, 1 - Number.EPSILON));

    if (!this.running) {
      return;
    }

    this.scheduleNextFrame();
  }
}
