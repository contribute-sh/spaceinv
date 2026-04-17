import { afterEach, describe, expect, it, vi } from "vitest";

import { CanvasHost } from "../CanvasHost";

type FillRectCall = {
  height: number;
  width: number;
  x: number;
  y: number;
};

class MockCanvasContext {
  public fillStyle: string | CanvasGradient | CanvasPattern = "";
  public readonly fillRectCalls: FillRectCall[] = [];
  public readonly transforms: [
    number,
    number,
    number,
    number,
    number,
    number,
  ][] = [];

  fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push({
      height,
      width,
      x,
      y,
    });
  }

  setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ): void {
    this.transforms.push([a, b, c, d, e, f]);
  }
}

const defaultInnerHeight = window.innerHeight;
const defaultInnerWidth = window.innerWidth;
const defaultDevicePixelRatio = window.devicePixelRatio;
const hosts: CanvasHost[] = [];

function createHost(target: HTMLCanvasElement | string): CanvasHost {
  const host = new CanvasHost(target);

  hosts.push(host);

  return host;
}

function mockCanvasContext(context: MockCanvasContext | null): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function getContext(contextId: string): CanvasRenderingContext2D | null {
      if (contextId !== "2d" || !context) {
        return null;
      }

      return context as unknown as CanvasRenderingContext2D;
    },
  );
}

function setViewport(
  width: number,
  height: number,
  devicePixelRatio = 1,
): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: devicePixelRatio,
  });
}

describe("CanvasHost", () => {
  afterEach(() => {
    for (const host of hosts.splice(0)) {
      host.detach();
    }

    document.body.innerHTML = "";
    setViewport(defaultInnerWidth, defaultInnerHeight, defaultDevicePixelRatio);
    vi.restoreAllMocks();
  });

  it("throws when a 2d context cannot be acquired", () => {
    const canvas = document.createElement("canvas");

    mockCanvasContext(null);

    expect(() => {
      createHost(canvas);
    }).toThrowError(/2D rendering context/i);
  });

  it("resizes the canvas using the viewport size and capped devicePixelRatio", () => {
    document.body.innerHTML = '<canvas id="game"></canvas>';

    const context = new MockCanvasContext();

    setViewport(800, 450, 3);
    mockCanvasContext(context);

    const host = createHost("#game");

    expect(host.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(host.width).toBe(800);
    expect(host.height).toBe(450);
    expect(host.canvas.style.width).toBe("800px");
    expect(host.canvas.style.height).toBe("450px");
    expect(host.canvas.width).toBe(1600);
    expect(host.canvas.height).toBe(900);
    expect(context.transforms.at(-1)).toEqual([2, 0, 0, 2, 0, 0]);
  });

  it("clears the full canvas with the provided color", () => {
    const canvas = document.createElement("canvas");
    const context = new MockCanvasContext();

    document.body.appendChild(canvas);
    setViewport(320, 180, 1.5);
    mockCanvasContext(context);

    const host = createHost(canvas);

    host.clear("#050816");

    expect(context.fillStyle).toBe("#050816");
    expect(context.fillRectCalls.at(-1)).toEqual({
      height: 180,
      width: 320,
      x: 0,
      y: 0,
    });
  });

  it("removes the resize listener when detached", () => {
    const canvas = document.createElement("canvas");
    const context = new MockCanvasContext();
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    document.body.appendChild(canvas);
    mockCanvasContext(context);

    const host = createHost(canvas);

    host.detach();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
  });
});
