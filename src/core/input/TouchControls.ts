export type InputState = {
  left: boolean;
  right: boolean;
  fire: boolean;
};

export type TouchControlsListener = (state: InputState) => void;

export type TouchControlsOptions = {
  root?: HTMLElement;
  target: HTMLElement;
};

type Region = keyof InputState | null;

const EMPTY_STATE: InputState = {
  left: false,
  right: false,
  fire: false,
};

const POINTER_EVENTS = [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
] as const;

const BASE_ZONE_STYLE =
  "position:absolute;bottom:0;height:50%;pointer-events:auto;touch-action:none;box-sizing:border-box;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);backdrop-filter:blur(2px);-webkit-tap-highlight-color:transparent;";

const ZONES = [
  ["left", "left:0;width:25%"],
  ["right", "left:25%;width:25%"],
  ["fire", "left:50%;width:50%"],
] as const;

export class TouchControls {
  private readonly listeners = new Set<TouchControlsListener>();
  private readonly pointers = new Map<number, Region>();
  private readonly zones: HTMLElement[] = [];
  private overlay: HTMLDivElement | null = null;
  private state: InputState = { ...EMPTY_STATE };

  public constructor(private readonly options: TouchControlsOptions) {
    if (!supportsTouchControls()) {
      return;
    }

    const root = options.root ?? document.body;

    if (!root) {
      return;
    }

    const rect = options.target.getBoundingClientRect();
    const overlay = document.createElement("div");

    overlay.dataset.touchControls = "true";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none;user-select:none;z-index:1000;`;

    for (const [name, layout] of ZONES) {
      const zone = document.createElement("div");

      zone.dataset.touchControlsZone = name;
      zone.style.cssText = `${BASE_ZONE_STYLE}${layout};`;

      for (const type of POINTER_EVENTS) {
        zone.addEventListener(type, this.handlePointer);
      }

      this.zones.push(zone);
      overlay.append(zone);
    }

    root.append(overlay);
    this.overlay = overlay;
  }

  public getState(): InputState {
    return Object.freeze({ ...this.state });
  }

  public subscribe(listener: TouchControlsListener): () => void {
    this.listeners.add(listener);

    return (): void => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    for (const zone of this.zones) {
      for (const type of POINTER_EVENTS) {
        zone.removeEventListener(type, this.handlePointer);
      }
    }

    this.zones.length = 0;
    this.listeners.clear();
    this.pointers.clear();
    this.state = { ...EMPTY_STATE };
    this.overlay?.remove();
    this.overlay = null;
  }

  private readonly handlePointer = (event: PointerEvent): void => {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.type === "pointerdown") {
      const zone = event.currentTarget;

      if (
        zone instanceof HTMLElement &&
        typeof zone.setPointerCapture === "function"
      ) {
        zone.setPointerCapture(event.pointerId);
      }
    }

    if (event.type === "pointerup" || event.type === "pointercancel") {
      this.pointers.delete(event.pointerId);
      this.publish();
      return;
    }

    if (event.type === "pointermove" && !this.pointers.has(event.pointerId)) {
      return;
    }

    this.pointers.set(
      event.pointerId,
      getRegion(this.options.target, event.clientX, event.clientY),
    );

    this.publish();
  };

  private publish(): void {
    const next = readState(this.pointers);

    if (
      next.left === this.state.left &&
      next.right === this.state.right &&
      next.fire === this.state.fire
    ) {
      return;
    }

    this.state = next;

    const snapshot = Object.freeze({ ...next });

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

function supportsTouchControls(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof window.PointerEvent === "function" &&
    "ontouchstart" in window
  );
}

function getRegion(
  target: HTMLElement,
  clientX: number,
  clientY: number,
): Region {
  const rect = target.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  if (x < 0 || x > rect.width || y < rect.height / 2 || y > rect.height) {
    return null;
  }

  if (x < rect.width / 4) {
    return "left";
  }

  if (x < rect.width / 2) {
    return "right";
  }

  return "fire";
}

function readState(pointers: ReadonlyMap<number, Region>): InputState {
  const state = { ...EMPTY_STATE };

  for (const region of pointers.values()) {
    if (region) {
      state[region] = true;
    }
  }

  return state;
}
