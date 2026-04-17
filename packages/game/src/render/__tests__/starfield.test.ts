import { describe, expect, it } from "vitest";

import { createStarfield } from "../starfield";

type DrawOperation =
  | {
      kind: "arc";
      radius: number;
      x: number;
      y: number;
    }
  | {
      height: number;
      kind: "fillRect";
      width: number;
      x: number;
      y: number;
    };

class MockCanvasContext {
  public readonly operations: DrawOperation[] = [];
  public beginPathCalls = 0;
  public fillCalls = 0;
  public fillStyle: string | CanvasGradient | CanvasPattern = "";

  arc(x: number, y: number, radius: number): void {
    this.operations.push({
      kind: "arc",
      radius,
      x,
      y
    });
  }

  beginPath(): void {
    this.beginPathCalls += 1;
  }

  fill(): void {
    this.fillCalls += 1;
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    this.operations.push({
      height,
      kind: "fillRect",
      width,
      x,
      y
    });
  }
}

function renderOperations(seed: number): DrawOperation[] {
  const starfield = createStarfield({
    width: 128,
    height: 72,
    layers: 3,
    seed
  });
  const ctx = new MockCanvasContext();

  starfield.render(ctx as unknown as CanvasRenderingContext2D);

  return ctx.operations;
}

describe("starfield", () => {
  it("renders identical star coordinates for matching seeds", () => {
    expect(renderOperations(7)).toEqual(renderOperations(7));
  });

  it("renders different star coordinates for different seeds", () => {
    expect(renderOperations(7)).not.toEqual(renderOperations(8));
  });

  it("wraps all star coordinates back into the canvas bounds after a large update", () => {
    const width = 96;
    const height = 48;
    const starfield = createStarfield({
      width,
      height,
      layers: 3,
      seed: 11
    });
    const ctx = new MockCanvasContext();

    starfield.update(10_000);
    starfield.render(ctx as unknown as CanvasRenderingContext2D);

    expect(ctx.operations.length).toBeGreaterThan(0);

    for (const operation of ctx.operations) {
      expect(operation.x).toBeGreaterThanOrEqual(0);
      expect(operation.x).toBeLessThan(width);
      expect(operation.y).toBeGreaterThanOrEqual(0);
      expect(operation.y).toBeLessThan(height);
    }
  });

  it("renders via canvas drawing calls without throwing", () => {
    const starfield = createStarfield({
      width: 160,
      height: 90,
      layers: 3,
      seed: 3
    });
    const ctx = new MockCanvasContext();

    expect(() =>
      starfield.render(ctx as unknown as CanvasRenderingContext2D)
    ).not.toThrow();
    expect(ctx.operations.some((operation) => operation.kind === "fillRect")).toBe(
      true
    );
    expect(ctx.operations.some((operation) => operation.kind === "arc")).toBe(
      true
    );
    expect(ctx.beginPathCalls).toBeGreaterThan(0);
    expect(ctx.fillCalls).toBeGreaterThan(0);
  });
});
