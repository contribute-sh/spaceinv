const MAX_DEVICE_PIXEL_RATIO = 2;

export type CanvasHostTarget = HTMLCanvasElement | string;

export interface CanvasHostOptions {
  target: CanvasHostTarget;
}

function getTarget(
  targetOrOptions: CanvasHostTarget | CanvasHostOptions,
): CanvasHostTarget {
  if (
    targetOrOptions instanceof HTMLCanvasElement ||
    typeof targetOrOptions === "string"
  ) {
    return targetOrOptions;
  }

  return targetOrOptions.target;
}

function resolveCanvas(target: CanvasHostTarget): HTMLCanvasElement {
  if (target instanceof HTMLCanvasElement) {
    return target;
  }

  const element = document.querySelector(target);

  if (element instanceof HTMLCanvasElement) {
    return element;
  }

  throw new Error(
    `CanvasHost could not resolve an HTMLCanvasElement from selector "${target}".`,
  );
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (context) {
    return context;
  }

  throw new Error("CanvasHost could not acquire a 2D rendering context.");
}

function getDevicePixelRatio(): number {
  const ratio = window.devicePixelRatio;

  if (!Number.isFinite(ratio) || ratio <= 0) {
    return 1;
  }

  return Math.min(ratio, MAX_DEVICE_PIXEL_RATIO);
}

export class CanvasHost {
  private readonly context: CanvasRenderingContext2D;
  private readonly resizeHandler: () => void;
  private readonly targetCanvas: HTMLCanvasElement;

  private attached = false;
  private viewportHeight = 0;
  private viewportWidth = 0;

  constructor(targetOrOptions: CanvasHostTarget | CanvasHostOptions) {
    this.targetCanvas = resolveCanvas(getTarget(targetOrOptions));
    this.context = getContext(this.targetCanvas);
    this.resizeHandler = () => {
      this.resize();
    };

    this.attach();
    this.resize();
  }

  get canvas(): HTMLCanvasElement {
    return this.targetCanvas;
  }

  get ctx(): CanvasRenderingContext2D {
    return this.context;
  }

  get height(): number {
    return this.viewportHeight;
  }

  get width(): number {
    return this.viewportWidth;
  }

  attach(): void {
    if (this.attached) {
      return;
    }

    window.addEventListener("resize", this.resizeHandler);
    this.attached = true;
  }

  clear(color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  detach(): void {
    if (!this.attached) {
      return;
    }

    window.removeEventListener("resize", this.resizeHandler);
    this.attached = false;
  }

  resize(): void {
    const devicePixelRatio = getDevicePixelRatio();

    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.targetCanvas.style.width = `${this.viewportWidth}px`;
    this.targetCanvas.style.height = `${this.viewportHeight}px`;
    this.targetCanvas.width = Math.round(this.viewportWidth * devicePixelRatio);
    this.targetCanvas.height = Math.round(
      this.viewportHeight * devicePixelRatio,
    );

    this.context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
}
