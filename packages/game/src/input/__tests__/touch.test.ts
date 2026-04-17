import { describe, expect, it, vi } from "vitest";

import { TouchInput } from "../touch";

type TouchPointFixture = {
  identifier: number;
  clientX: number;
  clientY: number;
};

type TouchEventFixture = {
  changedTouches: TouchPointFixture[];
  touches?: TouchPointFixture[];
};

function createTouch(
  identifier: number,
  clientX: number,
  clientY = 40
): TouchPointFixture {
  return {
    identifier,
    clientX,
    clientY,
  };
}

function dispatchTouchEvent(
  target: HTMLElement,
  type: string,
  fixture: TouchEventFixture
): Event {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperties(event, {
    changedTouches: {
      configurable: true,
      value: fixture.changedTouches,
    },
    touches: {
      configurable: true,
      value: fixture.touches ?? fixture.changedTouches,
    },
  });

  target.dispatchEvent(event);

  return event;
}

function createTouchSurface(): HTMLElement {
  const element = document.createElement("div");

  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
    DOMRectReadOnly.fromRect({
      x: 0,
      y: 0,
      width: 300,
      height: 120,
    })
  );

  return element;
}

describe("TouchInput", () => {
  it("sets axis to -1 for a left-region touch and resets it on release", () => {
    const target = createTouchSurface();
    const input = new TouchInput(target);
    const leftTouch = createTouch(1, 40);

    dispatchTouchEvent(target, "touchstart", {
      changedTouches: [leftTouch],
      touches: [leftTouch],
    });

    expect(input.read()).toEqual({
      axis: -1,
      fire: false,
    });

    dispatchTouchEvent(target, "touchend", {
      changedTouches: [leftTouch],
      touches: [],
    });

    expect(input.read()).toEqual({
      axis: 0,
      fire: false,
    });

    input.dispose();
  });

  it("sets axis to +1 for a right-region touch", () => {
    const target = createTouchSurface();
    const input = new TouchInput(target);
    const rightTouch = createTouch(2, 260);

    dispatchTouchEvent(target, "touchstart", {
      changedTouches: [rightTouch],
      touches: [rightTouch],
    });

    expect(input.sample()).toEqual({
      axis: 1,
      fire: false,
    });

    input.dispose();
  });

  it("sets fire for a touch in the center region and clears it on release", () => {
    const target = createTouchSurface();
    const input = new TouchInput(target);
    const fireTouch = createTouch(3, 150);

    dispatchTouchEvent(target, "touchstart", {
      changedTouches: [fireTouch],
      touches: [fireTouch],
    });

    expect(input.poll()).toEqual({
      axis: 0,
      fire: true,
    });

    dispatchTouchEvent(target, "touchend", {
      changedTouches: [fireTouch],
      touches: [],
    });

    expect(input.read()).toEqual({
      axis: 0,
      fire: false,
    });

    input.dispose();
  });

  it("allows a fire touch while another touch holds movement", () => {
    const target = createTouchSurface();
    const input = new TouchInput(target);
    const leftTouch = createTouch(4, 50);
    const fireTouch = createTouch(5, 150);

    dispatchTouchEvent(target, "touchstart", {
      changedTouches: [leftTouch],
      touches: [leftTouch],
    });
    dispatchTouchEvent(target, "touchstart", {
      changedTouches: [fireTouch],
      touches: [leftTouch, fireTouch],
    });

    expect(input.read()).toEqual({
      axis: -1,
      fire: true,
    });

    dispatchTouchEvent(target, "touchend", {
      changedTouches: [fireTouch],
      touches: [leftTouch],
    });

    expect(input.read()).toEqual({
      axis: -1,
      fire: false,
    });

    input.dispose();
  });

  it("clears only the canceled touch input", () => {
    const target = createTouchSurface();
    const input = new TouchInput(target);
    const leftTouch = createTouch(6, 30);
    const fireTouch = createTouch(7, 150);

    dispatchTouchEvent(target, "touchstart", {
      changedTouches: [leftTouch, fireTouch],
      touches: [leftTouch, fireTouch],
    });

    dispatchTouchEvent(target, "touchcancel", {
      changedTouches: [leftTouch],
      touches: [fireTouch],
    });

    expect(input.read()).toEqual({
      axis: 0,
      fire: true,
    });

    input.dispose();
  });

  it("updates a touch when it moves across regions", () => {
    const target = createTouchSurface();
    const input = new TouchInput(target);
    const touch = createTouch(8, 40);

    const startEvent = dispatchTouchEvent(target, "touchstart", {
      changedTouches: [touch],
      touches: [touch],
    });

    expect(startEvent.defaultPrevented).toBe(true);
    expect(input.read()).toEqual({
      axis: -1,
      fire: false,
    });

    const movedTouch = createTouch(8, 150);
    const moveEvent = dispatchTouchEvent(target, "touchmove", {
      changedTouches: [movedTouch],
      touches: [movedTouch],
    });

    expect(moveEvent.defaultPrevented).toBe(true);
    expect(input.read()).toEqual({
      axis: 0,
      fire: true,
    });

    input.dispose();
  });
});
