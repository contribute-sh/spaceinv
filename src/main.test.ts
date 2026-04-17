import { afterEach, describe, expect, it, vi } from "vitest";

import { bootstrap } from "./main";

type FillRectCall = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type FillTextCall = {
  text: string;
  x: number;
  y: number;
};

class MockCanvasContext {
  public fillStyle: string | CanvasGradient | CanvasPattern = "";
  public font = "";
  public textAlign: CanvasTextAlign = "start";
  public textBaseline: CanvasTextBaseline = "alphabetic";
  public readonly fillRectCalls: FillRectCall[] = [];
  public readonly fillTextCalls: FillTextCall[] = [];
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

  fillText(text: string, x: number, y: number): void {
    this.fillTextCalls.push({
      text,
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

function mockCanvasContext(context: MockCanvasContext): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function getContext(contextId: string): CanvasRenderingContext2D | null {
      return contextId === "2d"
        ? (context as unknown as CanvasRenderingContext2D)
        : null;
    },
  );
}

describe("main bootstrap", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 1,
    });
    vi.restoreAllMocks();
  });

  it("scales the canvas drawing buffer to the css size times devicePixelRatio", () => {
    const canvas = document.createElement("canvas");
    const context = new MockCanvasContext();

    canvas.style.width = "160px";
    canvas.style.height = "90px";
    document.body.appendChild(canvas);

    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });

    mockCanvasContext(context);

    const bootstrappedContext = bootstrap(canvas);

    expect(bootstrappedContext).not.toBeNull();
    expect(canvas.getContext("2d")).not.toBeNull();
    expect(canvas.width).toBe(320);
    expect(canvas.height).toBe(180);
    expect(context.transforms).toContainEqual([2, 0, 0, 2, 0, 0]);
    expect(context.fillRectCalls.at(-1)).toEqual({
      height: 90,
      width: 160,
      x: 0,
      y: 0,
    });
    expect(context.fillTextCalls.at(-1)).toEqual({
      text: "spaceinv",
      x: 80,
      y: 45,
    });
  });

  it("does not run the top-level bootstrap when #game is missing during import", async () => {
    vi.resetModules();

    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

    document.body.innerHTML = "";

    await import("./main");

    expect(getContextSpy).not.toHaveBeenCalled();
  });
});
