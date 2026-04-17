import { describe, expect, it, vi } from "vitest";

import { GameLoop, type GameLoopOptions } from "../GameLoop";

const FIXED_DT = 1 / 60;
const FIXED_DT_MS = FIXED_DT * 1000;

class FakeFrameScheduler {
  private nowMs = 0;
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();

  public get pendingCount(): number {
    return this.callbacks.size;
  }

  public readonly now = (): number => this.nowMs;

  public readonly schedule = (callback: () => void): (() => void) => {
    const id = this.nextId;

    this.nextId += 1;
    this.callbacks.set(id, callback);

    return (): void => {
      this.callbacks.delete(id);
    };
  };

  public advance(ms: number): void {
    this.nowMs += ms;

    const callbacks = Array.from(this.callbacks.values());

    this.callbacks.clear();

    for (const callback of callbacks) {
      callback();
    }
  }
}

function createLoop(options: Partial<GameLoopOptions> = {}) {
  const scheduler = new FakeFrameScheduler();
  const update = vi.fn((dt: number): void => {
    void dt;
  });
  const render = vi.fn((alpha: number): void => {
    void alpha;
  });
  const loop = new GameLoop({
    now: scheduler.now,
    render,
    schedule: scheduler.schedule,
    update,
    ...options,
  });

  return {
    loop,
    render,
    scheduler,
    update,
  };
}

function getLastRenderedAlpha(
  render: ReturnType<typeof createLoop>["render"],
): number {
  const lastRenderCall = render.mock.calls.at(-1);

  if (!lastRenderCall) {
    throw new Error("Expected render to be called.");
  }

  return lastRenderCall[0];
}

describe("GameLoop", () => {
  it("runs one fixed update for a roughly 16.67ms frame with alpha near zero", () => {
    const { loop, render, scheduler, update } = createLoop();

    loop.start();
    scheduler.advance(FIXED_DT_MS);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(FIXED_DT);
    expect(render).toHaveBeenCalledTimes(1);
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0, 6);
  });

  it("runs two fixed updates for a roughly 33.33ms frame", () => {
    const { loop, render, scheduler, update } = createLoop();

    loop.start();
    scheduler.advance(FIXED_DT_MS * 2);

    expect(update).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledTimes(1);
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0, 6);
  });

  it("carries leftover accumulator time across frames and renders interpolation alpha", () => {
    const { loop, render, scheduler, update } = createLoop();

    loop.start();
    scheduler.advance(25);

    expect(update).toHaveBeenCalledTimes(1);
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0.5, 6);

    scheduler.advance(10);

    expect(update).toHaveBeenCalledTimes(2);
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0.1, 6);
  });

  it("does not update when a frame is shorter than the fixed step and alpha grows", () => {
    const { loop, scheduler, update, render } = createLoop();

    loop.start();
    scheduler.advance(5);

    expect(update).not.toHaveBeenCalled();
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0.3, 6);

    scheduler.advance(5);

    expect(update).not.toHaveBeenCalled();
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0.6, 6);
  });

  it("clamps large frame deltas to avoid runaway update bursts", () => {
    const { loop, render, scheduler, update } = createLoop();

    loop.start();
    scheduler.advance(1_000);

    expect(update).toHaveBeenCalledTimes(15);
    expect(getLastRenderedAlpha(render)).toBeCloseTo(0, 6);
  });

  it("stops scheduling future updates after stop is called", () => {
    const { loop, render, scheduler, update } = createLoop();

    loop.start();
    scheduler.advance(FIXED_DT_MS);

    expect(update).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(scheduler.pendingCount).toBe(1);

    loop.stop();

    expect(scheduler.pendingCount).toBe(0);

    scheduler.advance(FIXED_DT_MS * 4);

    expect(update).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
