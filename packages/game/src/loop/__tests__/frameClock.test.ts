import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FrameTick } from "../frameClock";
import { start } from "../frameClock";

interface RafController {
  step(timestampMs: number): void;
}

function createRafController(): RafController {
  let currentTimeMs = 0;
  let nextFrameId = 1;
  const scheduledCallbacks = new Map<number, FrameRequestCallback>();

  globalThis.requestAnimationFrame = (
    callback: FrameRequestCallback,
  ): number => {
    const frameId = nextFrameId;
    nextFrameId += 1;
    scheduledCallbacks.set(frameId, callback);

    return frameId;
  };

  globalThis.cancelAnimationFrame = (frameId: number): void => {
    scheduledCallbacks.delete(frameId);
  };

  return {
    step(timestampMs: number): void {
      const elapsedMs = Math.max(0, timestampMs - currentTimeMs);

      vi.advanceTimersByTime(elapsedMs);
      currentTimeMs = timestampMs;

      const frameCallbacks = Array.from(scheduledCallbacks.entries()).sort(
        ([leftId], [rightId]) => leftId - rightId,
      );

      scheduledCallbacks.clear();

      for (const [, callback] of frameCallbacks) {
        callback(timestampMs);
      }
    },
  };
}

describe("frameClock", () => {
  let rafController: RafController;
  let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof globalThis.cancelAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();

    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    rafController = createRafController();
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    vi.useRealTimers();
  });

  it("reports monotonically increasing frame timestamps", () => {
    const ticks: FrameTick[] = [];

    start((tick) => {
      ticks.push(tick);
    });

    rafController.step(100);
    rafController.step(116);
    rafController.step(149);

    expect(ticks.map(({ now }) => Number(now.toFixed(3)))).toEqual([
      0.1, 0.116, 0.149,
    ]);
  });

  it("calculates dt from the timestamp delta between frames", () => {
    const ticks: FrameTick[] = [];

    start((tick) => {
      ticks.push(tick);
    });

    rafController.step(100);
    rafController.step(116);
    rafController.step(149);

    expect(ticks.map(({ dt }) => Number(dt.toFixed(3)))).toEqual([
      0, 0.016, 0.033,
    ]);
  });

  it("clamps dt when a large frame gap occurs", () => {
    const ticks: FrameTick[] = [];

    start((tick) => {
      ticks.push(tick);
    });

    rafController.step(100);
    rafController.step(2100);

    expect(ticks).toHaveLength(2);
    expect(ticks[1]!.dt).toBe(0.25);
  });

  it("stops scheduling callbacks after stop is called", () => {
    const ticks: FrameTick[] = [];

    const stop = start((tick) => {
      ticks.push(tick);
    });

    rafController.step(100);
    stop();
    rafController.step(116);

    expect(ticks).toHaveLength(1);
  });

  it("uses a zero dt for the first frame", () => {
    const ticks: FrameTick[] = [];

    start((tick) => {
      ticks.push(tick);
    });

    rafController.step(100);

    expect(ticks).toHaveLength(1);
    expect(ticks[0]!.dt).toBe(0);
  });
});
