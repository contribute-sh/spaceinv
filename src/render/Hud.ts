const DEFAULT_FONT = "20px sans-serif";
const DEFAULT_LIFE_COLOR = "#f8fafc";
const DEFAULT_LIFE_HEIGHT = 10;
const DEFAULT_LIFE_SPACING = 8;
const DEFAULT_LIFE_WIDTH = 18;
const DEFAULT_MARGIN = 16;
const DEFAULT_TEXT_COLOR = "#f8fafc";

export interface HudState {
  highScore: number;
  lives: number;
  score: number;
  wave: number;
}

export interface HudOptions {
  font?: string;
  lifeColor?: string;
  lifeHeight?: number;
  lifeSpacing?: number;
  lifeSprite?: CanvasImageSource;
  lifeWidth?: number;
  margin?: number;
  textColor?: string;
}

function normalizeDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getCanvasSize(canvas: HTMLCanvasElement): {
  height: number;
  width: number;
} {
  const { height: rectHeight, width: rectWidth } =
    canvas.getBoundingClientRect();

  if (rectWidth > 0 && rectHeight > 0) {
    return {
      height: rectHeight,
      width: rectWidth,
    };
  }

  return {
    height: normalizeDimension(
      canvas.clientHeight,
      normalizeDimension(canvas.height, 1),
    ),
    width: normalizeDimension(
      canvas.clientWidth,
      normalizeDimension(canvas.width, 1),
    ),
  };
}

function normalizeLives(lives: number): number {
  if (!Number.isFinite(lives) || lives <= 0) {
    return 0;
  }

  return Math.floor(lives);
}

export class Hud {
  private readonly font: string;
  private readonly lifeColor: string;
  private readonly lifeHeight: number;
  private readonly lifeSpacing: number;
  private readonly lifeSprite?: CanvasImageSource;
  private readonly lifeWidth: number;
  private readonly margin: number;
  private readonly textColor: string;

  constructor(options: HudOptions = {}) {
    this.font = options.font ?? DEFAULT_FONT;
    this.lifeColor = options.lifeColor ?? DEFAULT_LIFE_COLOR;
    this.lifeHeight = options.lifeHeight ?? DEFAULT_LIFE_HEIGHT;
    this.lifeSpacing = options.lifeSpacing ?? DEFAULT_LIFE_SPACING;
    this.lifeSprite = options.lifeSprite;
    this.lifeWidth = options.lifeWidth ?? DEFAULT_LIFE_WIDTH;
    this.margin = options.margin ?? DEFAULT_MARGIN;
    this.textColor = options.textColor ?? DEFAULT_TEXT_COLOR;
  }

  draw(context: CanvasRenderingContext2D, state: HudState): void {
    const { height, width } = getCanvasSize(context.canvas);

    context.font = this.font;
    context.fillStyle = this.textColor;
    context.textBaseline = "top";

    context.textAlign = "left";
    context.fillText(`SCORE ${state.score}`, this.margin, this.margin);

    context.textAlign = "center";
    context.fillText(`WAVE ${state.wave}`, width / 2, this.margin);

    context.textAlign = "right";
    context.fillText(
      `HIGH SCORE ${state.highScore}`,
      width - this.margin,
      this.margin,
    );

    this.drawLives(
      context,
      normalizeLives(state.lives),
      this.margin,
      height - this.margin - this.lifeHeight,
    );
  }

  private drawLives(
    context: CanvasRenderingContext2D,
    lives: number,
    x: number,
    y: number,
  ): void {
    if (lives <= 0) {
      return;
    }

    context.fillStyle = this.lifeColor;

    for (let index = 0; index < lives; index += 1) {
      const markerX = x + index * (this.lifeWidth + this.lifeSpacing);

      if (this.lifeSprite) {
        context.drawImage(
          this.lifeSprite,
          markerX,
          y,
          this.lifeWidth,
          this.lifeHeight,
        );
        continue;
      }

      context.fillRect(markerX, y, this.lifeWidth, this.lifeHeight);
    }
  }
}
