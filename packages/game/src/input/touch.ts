export interface InputState {
  axis: number;
  fire: boolean;
}

export type TouchInputTarget = HTMLElement | Window;

type TouchRegion = "left" | "right" | "fire";

type TouchPoint = {
  identifier: number;
  clientX: number;
  clientY: number;
};

type TouchEventLike = Event & {
  changedTouches: ArrayLike<TouchPoint>;
  touches: ArrayLike<TouchPoint>;
};

type HorizontalRect = {
  left: number;
  width: number;
};

function isTouchEventLike(event: Event): event is TouchEventLike {
  return "changedTouches" in event && "touches" in event;
}

function getHorizontalRect(target: TouchInputTarget): HorizontalRect {
  if (target instanceof Window) {
    const viewportWidth =
      target.innerWidth || target.document.documentElement.clientWidth;

    return {
      left: 0,
      width: viewportWidth,
    };
  }

  const rect = target.getBoundingClientRect();

  return {
    left: rect.left,
    width: rect.width,
  };
}

export class TouchInput {
  private readonly state: InputState = {
    axis: 0,
    fire: false,
  };

  private readonly assignments = new Map<number, TouchRegion>();

  private readonly listenerOptions: AddEventListenerOptions = {
    passive: false,
  };

  private target: TouchInputTarget | null = null;

  private readonly handleTouchStart = (event: Event): void => {
    this.handleTouchChange(event);
  };

  private readonly handleTouchMove = (event: Event): void => {
    this.handleTouchChange(event);
  };

  private readonly handleTouchEnd = (event: Event): void => {
    this.handleTouchRelease(event);
  };

  private readonly handleTouchCancel = (event: Event): void => {
    this.handleTouchRelease(event);
  };

  constructor(target?: TouchInputTarget) {
    if (target) {
      this.attach(target);
    }
  }

  attach(target: TouchInputTarget): void {
    if (this.target === target) {
      return;
    }

    this.detach();
    this.target = target;

    this.target.addEventListener(
      "touchstart",
      this.handleTouchStart,
      this.listenerOptions,
    );
    this.target.addEventListener(
      "touchmove",
      this.handleTouchMove,
      this.listenerOptions,
    );
    this.target.addEventListener(
      "touchend",
      this.handleTouchEnd,
      this.listenerOptions,
    );
    this.target.addEventListener(
      "touchcancel",
      this.handleTouchCancel,
      this.listenerOptions,
    );
  }

  detach(): void {
    if (this.target) {
      this.target.removeEventListener(
        "touchstart",
        this.handleTouchStart,
        this.listenerOptions,
      );
      this.target.removeEventListener(
        "touchmove",
        this.handleTouchMove,
        this.listenerOptions,
      );
      this.target.removeEventListener(
        "touchend",
        this.handleTouchEnd,
        this.listenerOptions,
      );
      this.target.removeEventListener(
        "touchcancel",
        this.handleTouchCancel,
        this.listenerOptions,
      );
    }

    this.target = null;
    this.reset();
  }

  dispose(): void {
    this.detach();
  }

  read(): InputState {
    return {
      axis: this.state.axis,
      fire: this.state.fire,
    };
  }

  private handleTouchChange(event: Event): void {
    if (!this.target || !isTouchEventLike(event)) {
      return;
    }

    event.preventDefault();

    for (const touch of Array.from(event.changedTouches)) {
      this.assignments.set(
        touch.identifier,
        this.resolveRegion(touch, this.target),
      );
    }

    this.syncState();
  }

  private handleTouchRelease(event: Event): void {
    if (!isTouchEventLike(event)) {
      return;
    }

    event.preventDefault();

    for (const touch of Array.from(event.changedTouches)) {
      this.assignments.delete(touch.identifier);
    }

    this.syncState();
  }

  private resolveRegion(
    touch: TouchPoint,
    target: TouchInputTarget,
  ): TouchRegion {
    const rect = getHorizontalRect(target);

    if (rect.width <= 0) {
      return "fire";
    }

    const leftBoundary = rect.left + rect.width / 3;
    const rightBoundary = rect.left + (rect.width * 2) / 3;

    if (touch.clientX < leftBoundary) {
      return "left";
    }

    if (touch.clientX >= rightBoundary) {
      return "right";
    }

    return "fire";
  }

  private syncState(): void {
    let hasLeft = false;
    let hasRight = false;
    let hasFire = false;

    for (const region of this.assignments.values()) {
      if (region === "left") {
        hasLeft = true;
        continue;
      }

      if (region === "right") {
        hasRight = true;
        continue;
      }

      hasFire = true;
    }

    this.state.axis = hasLeft === hasRight ? 0 : hasLeft ? -1 : 1;
    this.state.fire = hasFire;
  }

  private reset(): void {
    this.assignments.clear();
    this.state.axis = 0;
    this.state.fire = false;
  }
}
