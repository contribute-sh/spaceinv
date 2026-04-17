import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TouchInput, type InputState } from "../touch";

type SyntheticTouch = {
  identifier: number;
  clientX: number;
  clientY: number;
};

function createTouch(
  identifier: number,
  clientX: number,
  clientY: number,
): SyntheticTouch {
  return {
    identifier,
    clientX,
    clientY,
  };
}

function dispatchTouchEvent(
  element: HTMLElement,
  type: string,
  changedTouches: SyntheticTouch[],
  touches: SyntheticTouch[],
): Event {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperty(event, "changedTouches", {
    configurable: true,
    value: changedTouches,
  });
  Object.defineProperty(event, "touches", {
    configurable: true,
    value: touches,
  });

  element.dispatchEvent(event);

  return event;
}

function expectState(input: TouchInput, expected: InputState): void {
  expect(input.read()).toEqual(expected);
}

describe("TouchInput", () => {
  let element: HTMLDivElement;
  let input: TouchInput;

  beforeEach(() => {
    element = document.createElement("div");
    Object.defineProperty(element, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(0, 0, 300, 120),
    });
    document.body.appendChild(element);
    input = new TouchInput(element);
  });

  afterEach(() => {
    input.dispose();
    element.remove();
  });

  it("sets axis to -1 in the left region and resets on release", () => {
    const leftTouch = createTouch(1, 24, 40);
    const startEvent = dispatchTouchEvent(
      element,
      "touchstart",
      [leftTouch],
      [leftTouch],
    );

    expect(startEvent.defaultPrevented).toBe(true);
    expectState(input, { axis: -1, fire: false });

    dispatchTouchEvent(element, "touchend", [leftTouch], []);

    expectState(input, { axis: 0, fire: false });
  });

  it("sets axis to +1 in the right region", () => {
    const rightTouch = createTouch(2, 276, 40);

    dispatchTouchEvent(element, "touchstart", [rightTouch], [rightTouch]);

    expectState(input, { axis: 1, fire: false });
  });

  it("sets fire in the middle region and clears it on release", () => {
    const fireTouch = createTouch(3, 150, 40);

    dispatchTouchEvent(element, "touchstart", [fireTouch], [fireTouch]);

    expectState(input, { axis: 0, fire: true });

    dispatchTouchEvent(element, "touchend", [fireTouch], []);

    expectState(input, { axis: 0, fire: false });
  });

  it("keeps movement active when a separate fire touch ends", () => {
    const leftTouch = createTouch(4, 32, 40);
    const fireTouch = createTouch(5, 150, 40);

    dispatchTouchEvent(element, "touchstart", [leftTouch], [leftTouch]);
    dispatchTouchEvent(
      element,
      "touchstart",
      [fireTouch],
      [leftTouch, fireTouch],
    );

    expectState(input, { axis: -1, fire: true });

    dispatchTouchEvent(element, "touchend", [fireTouch], [leftTouch]);

    expectState(input, { axis: -1, fire: false });
  });

  it("clears canceled touches without affecting unrelated input", () => {
    const rightTouch = createTouch(6, 270, 40);
    const fireTouch = createTouch(7, 150, 40);

    dispatchTouchEvent(element, "touchstart", [rightTouch], [rightTouch]);
    dispatchTouchEvent(
      element,
      "touchstart",
      [fireTouch],
      [rightTouch, fireTouch],
    );

    expectState(input, { axis: 1, fire: true });

    dispatchTouchEvent(element, "touchcancel", [fireTouch], [rightTouch]);

    expectState(input, { axis: 1, fire: false });
  });
});
