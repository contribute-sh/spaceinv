import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TouchControls, type InputState } from "../TouchControls";

type Zone = "left" | "right" | "fire";
type PointerEventType =
  | "pointerdown"
  | "pointermove"
  | "pointerup"
  | "pointercancel";

type PointerInit = {
  pointerId?: number;
  clientX?: number;
  clientY?: number;
};

class MockPointerEvent extends Event {
  public readonly pointerId: number;
  public readonly clientX: number;
  public readonly clientY: number;

  public constructor(type: string, init: PointerInit = {}) {
    super(type, {
      bubbles: true,
      cancelable: true,
    });

    this.pointerId = init.pointerId ?? 0;
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
  }
}

const pointerDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "PointerEvent",
);
const touchDescriptor = Object.getOwnPropertyDescriptor(window, "ontouchstart");

const POINTS: Record<Zone, { clientX: number; clientY: number }> = {
  left: {
    clientX: 40,
    clientY: 180,
  },
  right: {
    clientX: 120,
    clientY: 180,
  },
  fire: {
    clientX: 260,
    clientY: 180,
  },
};

const STATE: Record<
  "idle" | Zone | "leftFire",
  { left: boolean; right: boolean; fire: boolean }
> = {
  idle: {
    left: false,
    right: false,
    fire: false,
  },
  left: {
    left: true,
    right: false,
    fire: false,
  },
  right: {
    left: false,
    right: true,
    fire: false,
  },
  fire: {
    left: false,
    right: false,
    fire: true,
  },
  leftFire: {
    left: true,
    right: false,
    fire: true,
  },
};

function installTouchSupport(): void {
  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    writable: true,
    value: MockPointerEvent,
  });
  Object.defineProperty(window, "ontouchstart", {
    configurable: true,
    value: null,
  });
}

function removeTouchSupport(): void {
  delete (window as { PointerEvent?: unknown }).PointerEvent;
  delete (window as { ontouchstart?: unknown }).ontouchstart;
}

function restoreTouchSupport(): void {
  if (pointerDescriptor) {
    Object.defineProperty(window, "PointerEvent", pointerDescriptor);
  } else {
    delete (window as { PointerEvent?: unknown }).PointerEvent;
  }

  if (touchDescriptor) {
    Object.defineProperty(window, "ontouchstart", touchDescriptor);
  } else {
    delete (window as { ontouchstart?: unknown }).ontouchstart;
  }
}

function createTarget(): HTMLElement {
  const target = document.createElement("div");

  vi.spyOn(target, "getBoundingClientRect").mockReturnValue(
    DOMRectReadOnly.fromRect({
      x: 10,
      y: 20,
      width: 300,
      height: 200,
    }),
  );

  document.body.append(target);

  return target;
}

function getZone(name: Zone): HTMLElement {
  const zone = document.body.querySelector<HTMLElement>(
    `[data-touch-controls-zone="${name}"]`,
  );

  if (!zone) {
    throw new Error(`Missing ${name} zone`);
  }

  return zone;
}

function dispatch(
  target: EventTarget,
  type: PointerEventType,
  init: PointerInit,
): MockPointerEvent {
  const event = new MockPointerEvent(type, init);

  target.dispatchEvent(event);

  return event;
}

beforeEach(() => {
  installTouchSupport();
  document.body.innerHTML = "";
});

afterEach(() => {
  restoreTouchSupport();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("TouchControls", () => {
  it.each(["left", "right", "fire"] as const)(
    "tracks %s press and release",
    (name) => {
      const controls = new TouchControls({ target: createTarget() });
      const zone = getZone(name);

      dispatch(zone, "pointerdown", {
        pointerId: 1,
        ...POINTS[name],
      });

      expect(controls.getState()).toEqual(STATE[name]);

      dispatch(zone, "pointerup", {
        pointerId: 1,
        ...POINTS[name],
      });

      expect(controls.getState()).toEqual(STATE.idle);
      controls.destroy();
    },
  );

  it("updates a held pointer as it moves across movement zones", () => {
    const controls = new TouchControls({ target: createTarget() });
    const seen: InputState[] = [];
    const stop = controls.subscribe((state) => {
      seen.push(state);
    });
    const left = getZone("left");
    const down = dispatch(left, "pointerdown", {
      pointerId: 1,
      ...POINTS.left,
    });

    expect(down.defaultPrevented).toBe(true);
    expect(Object.isFrozen(controls.getState())).toBe(true);

    dispatch(left, "pointermove", {
      pointerId: 1,
      ...POINTS.right,
    });
    dispatch(left, "pointerup", {
      pointerId: 1,
      ...POINTS.right,
    });

    expect(seen).toEqual([STATE.left, STATE.right, STATE.idle]);

    stop();
    controls.destroy();
  });

  it("supports simultaneous left and fire touches", () => {
    const controls = new TouchControls({ target: createTarget() });

    dispatch(getZone("left"), "pointerdown", {
      pointerId: 1,
      ...POINTS.left,
    });
    dispatch(getZone("fire"), "pointerdown", {
      pointerId: 2,
      ...POINTS.fire,
    });

    expect(controls.getState()).toEqual(STATE.leftFire);

    dispatch(getZone("left"), "pointercancel", {
      pointerId: 1,
      ...POINTS.left,
    });

    expect(controls.getState()).toEqual(STATE.fire);

    dispatch(getZone("fire"), "pointerup", {
      pointerId: 2,
      ...POINTS.fire,
    });

    expect(controls.getState()).toEqual(STATE.idle);
    controls.destroy();
  });

  it("no-ops without pointer or touch support", () => {
    removeTouchSupport();

    const root = document.createElement("div");
    const controls = new TouchControls({ root, target: createTarget() });
    let called = false;
    const unsubscribe = controls.subscribe(() => {
      called = true;
    });

    expect(root.childElementCount).toBe(0);
    expect(document.body.querySelector("[data-touch-controls]")).toBeNull();
    expect(controls.getState()).toEqual(STATE.idle);

    unsubscribe();
    controls.destroy();

    expect(called).toBe(false);
  });
});
