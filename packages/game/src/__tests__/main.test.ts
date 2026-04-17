import { afterEach, describe, expect, it, vi } from "vitest";

import { bootstrap, startLoop, type CanvasApp } from "../main";

type FillRectCall = {
  height: number;
  width: number;
  x: number;
  y: number;
};

class MockCanvasContext {
  public readonly fillRectCalls: FillRectCall[] = [];
  public readonly transforms: [number, number, number, number, number, number][] =
    [];
  public fillStyle: string | CanvasGradient | CanvasPattern = "";

  fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push({
      height,
      width,
      x,
      y
    });
  }

  setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): void {
    this.transforms.push([a, b, c, d, e, f]);
  }
}

function mockCanvasContext(context: MockCanvasContext): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function getContext(contextId: string): CanvasRenderingContext2D | null {
      return contextId === "2d"
        ? (context as unknown as CanvasRenderingContext2D)
        : null;
    }
  );
}

describe("main entry", () => {
  let canvasApp: CanvasApp | null = null;

  afterEach(() => {
    canvasApp?.destroy();
    canvasApp = null;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("mounts a canvas inside #app with viewport dimensions after bootstrap", () => {
    document.body.innerHTML = '<div id="app"></div>';

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 640
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 360
    });
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2
    });

    const context = new MockCanvasContext();

    mockCanvasContext(context);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    canvasApp = bootstrap();

    const app = document.getElementById("app");
    const canvas = app?.querySelector("canvas");

    expect(canvasApp).not.toBeNull();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas?.parentElement).toBe(app);
    expect(canvas?.width).toBe(1280);
    expect(canvas?.height).toBe(720);
    expect(canvas?.style.width).toBe("640px");
    expect(canvas?.style.height).toBe("360px");
    expect(context.transforms.at(-1)).toEqual([2, 0, 0, 2, 0, 0]);
    expect(context.fillRectCalls.at(-1)).toEqual({
      height: 360,
      width: 640,
      x: 0,
      y: 0
    });
  });

  it("registers and cancels the animation loop without throwing", () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(() => 17);
    const cancelAnimationFrameSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);

    const stop = startLoop(() => undefined);

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    expect(() => stop()).not.toThrow();
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(17);
  });
});
