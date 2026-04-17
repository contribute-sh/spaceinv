export type InputState = {
  axis: number;
  fire: boolean;
};

export type TouchInputTarget = HTMLElement | Window;

type TouchPointLike = {
  identifier: number;
  clientX: number;
  clientY: number;
};

type TouchListLike = ArrayLike<TouchPointLike>;

type TouchEventLike = Event & {
  changedTouches?: TouchListLike;
  touches?: TouchListLike;
};

type TouchRegion = "left" | "right" | "fire";

type ActiveTouch = {
  region: TouchRegion;
  sequence: number;
};

const NEUTRAL_INPUT_STATE: InputState = {
  axis: 0,
  fire: false,
};

export class TouchInput {
  private target: TouchInputTarget | null = null;
  private readonly activeTouches = new Map<number, ActiveTouch>();
  private readonly listenerOptions: AddEventListenerOptions = {
    passive: false,
  };
  private state: InputState = { ...NEUTRAL_INPUT_STATE };
  private sequence = 0;

  public constructor(target?: TouchInputTarget) {
    if (target) {
      this.attach(target);
    }
  }

  public attach(target: TouchInputTarget): void {
    if (this.target === target) {
      return;
    }

    this.detach();
    this.target = target;

    target.addEventListener(
      "touchstart",
      this.handleTouchEvent,
      this.listenerOptions
    );
    target.addEventListener(
      "touchmove",
      this.handleTouchEvent,
      this.listenerOptions
    );
    target.addEventListener(
      "touchend",
      this.handleTouchEvent,
      this.listenerOptions
    );
    target.addEventListener(
      "touchcancel",
      this.handleTouchEvent,
      this.listenerOptions
    );
  }

  public detach(): void {
    if (!this.target) {
      return;
    }

    this.target.removeEventListener("touchstart", this.handleTouchEvent);
    this.target.removeEventListener("touchmove", this.handleTouchEvent);
    this.target.removeEventListener("touchend", this.handleTouchEvent);
    this.target.removeEventListener("touchcancel", this.handleTouchEvent);

    this.target = null;
    this.activeTouches.clear();
    this.state = { ...NEUTRAL_INPUT_STATE };
  }

  public dispose(): void {
    this.detach();
  }

  public read(): InputState {
    return { ...this.state };
  }

  public sample(): InputState {
    return this.read();
  }

  public poll(): InputState {
    return this.read();
  }

  private readonly handleTouchEvent = (event: Event): void => {
    const touchEvent = event as TouchEventLike;

    touchEvent.preventDefault();

    if (!this.target) {
      return;
    }

    const changedTouches = toTouchPoints(touchEvent.changedTouches);

    if (event.type === "touchend" || event.type === "touchcancel") {
      for (const touch of changedTouches) {
        this.activeTouches.delete(touch.identifier);
      }
    } else {
      for (const touch of changedTouches) {
        this.activeTouches.set(touch.identifier, {
          region: getTouchRegion(touch, this.target),
          sequence: this.nextSequence(),
        });
      }
    }

    this.state = readActiveInputState(this.activeTouches);
  };

  private nextSequence(): number {
    this.sequence += 1;

    return this.sequence;
  }
}

function toTouchPoints(touches?: TouchListLike): TouchPointLike[] {
  if (!touches) {
    return [];
  }

  return Array.from(touches);
}

function getTouchRegion(
  touch: TouchPointLike,
  target: TouchInputTarget
): TouchRegion {
  const rect = getTargetRect(target);

  if (rect.width <= 0) {
    return "fire";
  }

  const relativeX = touch.clientX - rect.left;
  const normalizedX = relativeX / rect.width;

  if (normalizedX < 1 / 3) {
    return "left";
  }

  if (normalizedX > 2 / 3) {
    return "right";
  }

  return "fire";
}

function getTargetRect(target: TouchInputTarget): DOMRectReadOnly {
  if (isWindow(target)) {
    return DOMRectReadOnly.fromRect({
      x: 0,
      y: 0,
      width: target.innerWidth,
      height: target.innerHeight,
    });
  }

  return target.getBoundingClientRect();
}

function isWindow(target: TouchInputTarget): target is Window {
  return "innerWidth" in target && "innerHeight" in target;
}

function readActiveInputState(
  activeTouches: ReadonlyMap<number, ActiveTouch>
): InputState {
  let axis = 0;
  let axisSequence = -1;
  let fire = false;

  for (const touch of activeTouches.values()) {
    if (touch.region === "fire") {
      fire = true;
      continue;
    }

    if (touch.sequence > axisSequence) {
      axis = touch.region === "left" ? -1 : 1;
      axisSequence = touch.sequence;
    }
  }

  if (axisSequence === -1 && !fire) {
    return { ...NEUTRAL_INPUT_STATE };
  }

  return {
    axis,
    fire,
  };
}
