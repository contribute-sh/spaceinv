import { describe, expect, it, vi } from "vitest";

import { SpriteRenderer, type SpriteFrameKey, type SpriteFrameTable } from "../spriteRenderer";

type DrawImageCall = {
  atlas: CanvasImageSource;
  dh: number;
  dw: number;
  dx: number;
  dy: number;
  sh: number;
  sw: number;
  sx: number;
  sy: number;
};

class MockCanvasContext {
  public readonly drawCalls: DrawImageCall[] = [];

  public readonly drawImage = vi.fn(
    (
      atlas: CanvasImageSource,
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
    ): void => {
      this.drawCalls.push({
        atlas,
        dh,
        dw,
        dx,
        dy,
        sh,
        sw,
        sx,
        sy,
      });
    },
  );
}

const FRAMES: SpriteFrameTable = {
  "ship-0": { x: 0, y: 0, w: 16, h: 16 },
  "ship-1": { x: 16, y: 0, w: 16, h: 16 },
  "ship-2": { x: 32, y: 0, w: 16, h: 16 },
};

function createAtlas(): HTMLImageElement {
  const atlas = document.createElement("img");

  atlas.width = 48;
  atlas.height = 16;

  return atlas;
}

function createContext(): MockCanvasContext {
  return new MockCanvasContext();
}

function canvasContext(ctx: MockCanvasContext): CanvasRenderingContext2D {
  return ctx as unknown as CanvasRenderingContext2D;
}

function draw(
  renderer: SpriteRenderer,
  ctx: MockCanvasContext,
  frameKey: SpriteFrameKey,
  dx: number,
  dy: number,
  options?: Parameters<SpriteRenderer["draw"]>[4],
): void {
  renderer.draw(canvasContext(ctx), frameKey, dx, dy, options);
}

function expectDrawCalls(
  ctx: MockCanvasContext,
  atlas: CanvasImageSource,
  calls: Array<Omit<DrawImageCall, "atlas">>,
): void {
  expect(ctx.drawCalls).toEqual(calls.map((call) => ({ atlas, ...call })));
}

describe("SpriteRenderer", () => {
  it("draws the source rect for a named frame", () => {
    const atlas = createAtlas();
    const renderer = new SpriteRenderer(atlas, FRAMES);
    const ctx = createContext();

    draw(renderer, ctx, "ship-1", 24, 12);

    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expectDrawCalls(ctx, atlas, [
      {
        dh: 16,
        dw: 16,
        dx: 24,
        dy: 12,
        sh: 16,
        sw: 16,
        sx: 16,
        sy: 0,
      },
    ]);
  });

  it("selects animated frames by fps schedule or explicit frame index", () => {
    const atlas = createAtlas();
    const renderer = new SpriteRenderer(atlas, FRAMES);
    const ctx = createContext();

    draw(renderer, ctx, ["ship-0", "ship-1", "ship-2"], 0, 0, {
      elapsedSeconds: 0.51,
      framesPerSecond: 4,
    });
    draw(renderer, ctx, [0, 1, 2], 20, 0, { frameIndex: 1 });

    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    expectDrawCalls(ctx, atlas, [
      {
        dh: 16,
        dw: 16,
        dx: 0,
        dy: 0,
        sh: 16,
        sw: 16,
        sx: 32,
        sy: 0,
      },
      {
        dh: 16,
        dw: 16,
        dx: 20,
        dy: 0,
        sh: 16,
        sw: 16,
        sx: 16,
        sy: 0,
      },
    ]);
  });

  it("batches draws and flushes them grouped by frame", () => {
    const atlas = createAtlas();
    const renderer = new SpriteRenderer(atlas, FRAMES);
    const ctx = createContext();

    renderer.begin();
    draw(renderer, ctx, "ship-1", 40, 8);
    draw(renderer, ctx, "ship-0", 10, 8);
    draw(renderer, ctx, "ship-1", 60, 8);
    draw(renderer, ctx, 0, 30, 8);

    expect(ctx.drawImage).not.toHaveBeenCalled();

    renderer.flush();

    expect(ctx.drawImage).toHaveBeenCalledTimes(4);
    expectDrawCalls(ctx, atlas, [
      {
        dh: 16,
        dw: 16,
        dx: 40,
        dy: 8,
        sh: 16,
        sw: 16,
        sx: 16,
        sy: 0,
      },
      {
        dh: 16,
        dw: 16,
        dx: 60,
        dy: 8,
        sh: 16,
        sw: 16,
        sx: 16,
        sy: 0,
      },
      {
        dh: 16,
        dw: 16,
        dx: 10,
        dy: 8,
        sh: 16,
        sw: 16,
        sx: 0,
        sy: 0,
      },
      {
        dh: 16,
        dw: 16,
        dx: 30,
        dy: 8,
        sh: 16,
        sw: 16,
        sx: 0,
        sy: 0,
      },
    ]);
  });
});
