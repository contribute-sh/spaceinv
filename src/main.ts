const BACKGROUND_COLOR = "#050816";
const PLACEHOLDER_TEXT = "spaceinv";
const TEXT_COLOR = "#f8fafc";

function normalizeSize(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getCanvasCssSize(canvas: HTMLCanvasElement): {
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

  const view = canvas.ownerDocument.defaultView;

  if (view) {
    const styles = view.getComputedStyle(canvas);
    const computedWidth = Number.parseFloat(styles.width);
    const computedHeight = Number.parseFloat(styles.height);

    return {
      height: normalizeSize(computedHeight, normalizeSize(canvas.height, 1)),
      width: normalizeSize(computedWidth, normalizeSize(canvas.width, 1)),
    };
  }

  return {
    height: normalizeSize(canvas.height, 1),
    width: normalizeSize(canvas.width, 1),
  };
}

function getDevicePixelRatio(canvas: HTMLCanvasElement): number {
  const devicePixelRatio =
    canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;

  return Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
}

export function bootstrap(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D | null {
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const { height: cssHeight, width: cssWidth } = getCanvasCssSize(canvas);
  const devicePixelRatio = getDevicePixelRatio(canvas);

  canvas.width = Math.round(cssWidth * devicePixelRatio);
  canvas.height = Math.round(cssHeight * devicePixelRatio);

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, cssWidth, cssHeight);
  context.fillStyle = TEXT_COLOR;
  context.font = "32px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(PLACEHOLDER_TEXT, cssWidth / 2, cssHeight / 2);

  return context;
}

const gameCanvas =
  typeof document !== "undefined" ? document.getElementById("game") : null;

if (gameCanvas instanceof HTMLCanvasElement) {
  bootstrap(gameCanvas);
}
