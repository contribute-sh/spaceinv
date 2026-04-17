/// <reference types="vite/client" />

const DEFAULT_CLEAR_COLOR = "#000";

export interface CanvasApp {
  app: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  destroy: () => void;
  render: () => void;
  resize: () => void;
  stop: () => void;
}

let activeCanvasApp: CanvasApp | null = null;

function hasDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function normalizeViewportSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function normalizeDevicePixelRatio(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function clearFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  clearColor = DEFAULT_CLEAR_COLOR
): void {
  context.fillStyle = clearColor;
  context.fillRect(0, 0, width, height);
}

function ensureCanvas(app: HTMLElement): HTMLCanvasElement {
  const existingCanvas = app.querySelector("canvas");

  if (existingCanvas instanceof HTMLCanvasElement) {
    return existingCanvas;
  }

  const canvas = app.ownerDocument.createElement("canvas");
  app.appendChild(canvas);

  return canvas;
}

export function startLoop(step: () => void): () => void {
  if (
    typeof globalThis.requestAnimationFrame !== "function" ||
    typeof globalThis.cancelAnimationFrame !== "function"
  ) {
    return () => {};
  }

  let frameId = 0;
  let stopped = false;

  const onFrame = (): void => {
    if (stopped) {
      return;
    }

    step();
    frameId = globalThis.requestAnimationFrame(onFrame);
  };

  frameId = globalThis.requestAnimationFrame(onFrame);

  return (): void => {
    if (stopped) {
      return;
    }

    stopped = true;
    globalThis.cancelAnimationFrame(frameId);
  };
}

export function bootstrap(): CanvasApp | null {
  if (!hasDom()) {
    return null;
  }

  if (activeCanvasApp) {
    return activeCanvasApp;
  }

  const app = document.getElementById("app");

  if (!(app instanceof HTMLElement)) {
    return null;
  }

  const canvas = ensureCanvas(app);
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  document.body.style.margin = "0";
  document.body.style.fontSize = "0";
  document.body.style.lineHeight = "0";
  document.body.style.overflow = "hidden";
  app.style.bottom = "0";
  app.style.left = "0";
  app.style.overflow = "hidden";
  app.style.position = "fixed";
  app.style.right = "0";
  app.style.top = "0";

  let viewportWidth = 1;
  let viewportHeight = 1;

  const render = (): void => {
    clearFrame(context, viewportWidth, viewportHeight);
  };

  const resize = (): void => {
    viewportWidth = normalizeViewportSize(window.innerWidth);
    viewportHeight = normalizeViewportSize(window.innerHeight);

    const devicePixelRatio = normalizeDevicePixelRatio(window.devicePixelRatio);

    canvas.width = Math.round(viewportWidth * devicePixelRatio);
    canvas.height = Math.round(viewportHeight * devicePixelRatio);
    canvas.style.display = "block";
    canvas.style.height = `${viewportHeight}px`;
    canvas.style.width = `${viewportWidth}px`;

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    render();
  };

  window.addEventListener("resize", resize);
  resize();

  const stop = startLoop(render);

  const canvasApp: CanvasApp = {
    app,
    canvas,
    context,
    destroy: (): void => {
      stop();
      window.removeEventListener("resize", resize);

      if (activeCanvasApp === canvasApp) {
        activeCanvasApp = null;
      }
    },
    render,
    resize,
    stop
  };

  activeCanvasApp = canvasApp;

  return canvasApp;
}

if (hasDom() && import.meta.env.MODE !== "test") {
  bootstrap();
}
