const MAX_FRAME_DELTA_SECONDS = 0.25;
const MILLISECONDS_PER_SECOND = 1000;

export interface FrameTick {
  dt: number;
  now: number;
}

export function start(callback: (tick: FrameTick) => void): () => void {
  let frameId = 0;
  let isRunning = true;
  let previousNowSeconds: number | null = null;

  const onFrame = (timestampMs: number): void => {
    if (!isRunning) {
      return;
    }

    const now = timestampMs / MILLISECONDS_PER_SECOND;
    const dt =
      previousNowSeconds === null
        ? 0
        : Math.min(
            Math.max(0, now - previousNowSeconds),
            MAX_FRAME_DELTA_SECONDS,
          );

    previousNowSeconds = now;
    callback({ dt, now });

    if (isRunning) {
      frameId = requestAnimationFrame(onFrame);
    }
  };

  frameId = requestAnimationFrame(onFrame);

  return (): void => {
    if (!isRunning) {
      return;
    }

    isRunning = false;
    cancelAnimationFrame(frameId);
  };
}
