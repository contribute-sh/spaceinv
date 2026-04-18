import { describe, expect, it } from "vitest";

import { Hud, type HudState } from "../Hud";

type DrawImageCall = {
  height: number;
  image: CanvasImageSource;
  width: number;
  x: number;
  y: number;
};

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

type Operation =
  | {
      type: "drawImage";
    }
  | {
      type: "fillRect";
    }
  | {
      type: "fillStyle";
      value: string | CanvasGradient | CanvasPattern;
    }
  | {
      type: "fillText";
      value: string;
    }
  | {
      type: "font";
      value: string;
    };

const DEFAULT_STATE: HudState = {
  highScore: 4200,
  lives: 3,
  score: 1200,
  wave: 4,
};

class MockCanvasRenderingContext2D {
  public readonly canvas: HTMLCanvasElement;
  public readonly drawImageCalls: DrawImageCall[] = [];
  public readonly fillRectCalls: FillRectCall[] = [];
  public readonly fillTextCalls: FillTextCall[] = [];
  public readonly operations: Operation[] = [];
  public textAlign: CanvasTextAlign = "start";
  public textBaseline: CanvasTextBaseline = "alphabetic";

  private currentFillStyle: string | CanvasGradient | CanvasPattern = "";
  private currentFont = "";

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
  }

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this.currentFillStyle;
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    this.currentFillStyle = value;
    this.operations.push({
      type: "fillStyle",
      value,
    });
  }

  get font(): string {
    return this.currentFont;
  }

  set font(value: string) {
    this.currentFont = value;
    this.operations.push({
      type: "font",
      value,
    });
  }

  drawImage(
    image: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.drawImageCalls.push({
      height,
      image,
      width,
      x,
      y,
    });
    this.operations.push({
      type: "drawImage",
    });
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    this.fillRectCalls.push({
      height,
      width,
      x,
      y,
    });
    this.operations.push({
      type: "fillRect",
    });
  }

  fillText(text: string, x: number, y: number): void {
    this.fillTextCalls.push({
      text,
      x,
      y,
    });
    this.operations.push({
      type: "fillText",
      value: text,
    });
  }
}

function createContext(
  width = 640,
  height = 360,
): MockCanvasRenderingContext2D {
  return new MockCanvasRenderingContext2D(width, height);
}

function createHud(options?: ConstructorParameters<typeof Hud>[0]): Hud {
  return new Hud(options);
}

describe("Hud", () => {
  it("renders score, wave, and high score text", () => {
    const context = createContext();

    createHud().draw(
      context as unknown as CanvasRenderingContext2D,
      DEFAULT_STATE,
    );

    expect(context.fillTextCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "SCORE 1200",
        }),
        expect.objectContaining({
          text: "WAVE 4",
        }),
        expect.objectContaining({
          text: "HIGH SCORE 4200",
        }),
      ]),
    );
  });

  it.each([
    { lives: 0, markers: 0 },
    { lives: 1, markers: 1 },
    { lives: 3, markers: 3 },
  ])(
    "draws the correct number of life markers when lives is $lives",
    ({ lives, markers }) => {
      const context = createContext();

      createHud().draw(context as unknown as CanvasRenderingContext2D, {
        ...DEFAULT_STATE,
        lives,
      });

      expect(context.fillRectCalls).toHaveLength(markers);
      expect(context.drawImageCalls).toHaveLength(0);
    },
  );

  it("sets text styles before rendering text", () => {
    const context = createContext();

    createHud().draw(
      context as unknown as CanvasRenderingContext2D,
      DEFAULT_STATE,
    );

    const fontIndex = context.operations.findIndex(
      (operation) => operation.type === "font",
    );
    const fillStyleIndex = context.operations.findIndex(
      (operation) => operation.type === "fillStyle",
    );
    const firstTextIndex = context.operations.findIndex(
      (operation) => operation.type === "fillText",
    );

    expect(fontIndex).toBeGreaterThanOrEqual(0);
    expect(fillStyleIndex).toBeGreaterThanOrEqual(0);
    expect(firstTextIndex).toBeGreaterThan(fillStyleIndex);
    expect(firstTextIndex).toBeGreaterThan(fontIndex);
    expect(context.font).toBe("20px sans-serif");
    expect(context.fillStyle).toBe("#f8fafc");
  });

  it("uses drawImage for life markers when a sprite is supplied", () => {
    const context = createContext();
    const sprite = document.createElement("canvas");

    createHud({ lifeSprite: sprite }).draw(
      context as unknown as CanvasRenderingContext2D,
      DEFAULT_STATE,
    );

    expect(context.fillRectCalls).toHaveLength(0);
    expect(context.drawImageCalls).toHaveLength(DEFAULT_STATE.lives);
  });
});
