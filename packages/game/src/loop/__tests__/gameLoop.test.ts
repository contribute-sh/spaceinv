import { describe, expect, it, vi } from "vitest";

import { GameLoop } from "../gameLoop";

type FrameCallback = (t: number) => void;

class MockFrameScheduler {
  public readonly cancelledIds: number[] = [];
  private nowMs = 0;
  private nextId = 1;
  private readonly callbacks = new Map<number, FrameCallback>();

  get pendingCount(): number {
    return this.callbacks.size;
  }

  now = (): number => this.nowMs;

  requestAnimationFrame = (callback: FrameCallback): number => {
    const id = this.nextId;

    this.nextId += 1;
    this.callbacks.set(id, callback);

    return id;
  };

  cancelAnimationFrame = (id: number): void => {
    if (!this.callbacks.delete(id)) {
      return;
    }

    this.cancelledIds.push(id);
  };

  advance(ms: number): void {
    this.nowMs += ms;

    const callbacks = Array.from(this.callbacks.values());

    this.callbacks.clear();

    for (const callback of callbacks) {
      callback(this.nowMs);
    }
  }

  peekPendingId(): number {
    const [id] = this.callbacks.keys();

    if (id === undefined) {
      throw new Error("Expected a pending animation frame.");
    }

    return id;
  }
}

function createLoop(
  scheduler: MockFrameScheduler,
  options: Partial<ConstructorParameters<typeof GameLoop>[0]> = {},
) {
  const update = vi.fn((dt: number): void => {
    void dt;
  });
  const render = vi.fn((alpha: number): void => {
    void alpha;
  });
  const loop = new GameLoop({
    cancelRaf: scheduler.cancelAnimationFrame,
    maxFrameTime: 1,
    now: scheduler.now,
    raf: scheduler.requestAnimationFrame,
    render,
    step: 0.125,
    update,
    ...options,
  });

  return {
    loop,
    render,
    update,
  };
}

describe("GameLoop", () => {
  it("runs one fixed update per elapsed step", () => {
    const scheduler = new MockFrameScheduler();
    const { loop, render, update } = createLoop(scheduler);

    loop.start();
    scheduler.advance(375);

    expect(update).toHaveBeenCalledTimes(3);

    for (const [dt] of update.mock.calls) {
      expect(dt).toBe(0.125);
    }

    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith(0);
  });

  it("renders the leftover interpolation alpha in the [0, 1) range", () => {
    const scheduler = new MockFrameScheduler();
    const { loop, render, update } = createLoop(scheduler);

    loop.start();
    scheduler.advance(312.5);

    expect(update).toHaveBeenCalledTimes(2);

    const firstRenderCall = render.mock.calls[0];

    if (!firstRenderCall) {
      throw new Error("Expected render to be called.");
    }

    const [alpha] = firstRenderCall;

    expect(alpha).toBe(0.5);
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThan(1);
  });

  it("cancels the pending frame and prevents more ticks after stop", () => {
    const scheduler = new MockFrameScheduler();
    const { loop, render, update } = createLoop(scheduler);

    loop.start();
    scheduler.advance(125);

    expect(update).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);

    const pendingFrameId = scheduler.peekPendingId();

    loop.stop();

    expect(scheduler.cancelledIds).toEqual([pendingFrameId]);
    expect(scheduler.pendingCount).toBe(0);

    scheduler.advance(125);

    expect(update).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("clamps large frame times to prevent runaway updates", () => {
    const scheduler = new MockFrameScheduler();
    const { loop, render, update } = createLoop(scheduler, {
      maxFrameTime: 0.25,
    });

    loop.start();
    scheduler.advance(2_000);

    expect(update).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledWith(0);
  });

  it("does not schedule duplicate frames when start is called repeatedly", () => {
    const scheduler = new MockFrameScheduler();
    const { loop, render, update } = createLoop(scheduler);

    loop.start();
    loop.start();

    expect(scheduler.pendingCount).toBe(1);

    scheduler.advance(125);

    expect(update).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(scheduler.pendingCount).toBe(1);
  });
});
