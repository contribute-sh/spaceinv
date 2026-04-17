import { describe, expect, it } from "vitest";

import { KeyboardInput } from "../keyboard";

function dispatchKeyboardEvent(
  target: EventTarget,
  type: "keydown" | "keyup",
  code: string,
  options: KeyboardEventInit = {}
): void {
  target.dispatchEvent(
    new KeyboardEvent(type, {
      ...options,
      code,
    })
  );
}

describe("KeyboardInput", () => {
  it("maps the configured keys to the readable keyboard state", () => {
    const target = new EventTarget();
    const keyboard = new KeyboardInput(target);

    dispatchKeyboardEvent(target, "keydown", "ArrowLeft");
    expect(keyboard.state).toEqual({
      left: true,
      right: false,
      fire: false,
    });
    expect(keyboard.read()).toEqual({
      moveAxis: -1,
      fire: false,
      pause: false,
    });

    dispatchKeyboardEvent(target, "keyup", "ArrowLeft");
    dispatchKeyboardEvent(target, "keydown", "KeyA");
    expect(keyboard.state).toEqual({
      left: true,
      right: false,
      fire: false,
    });

    dispatchKeyboardEvent(target, "keyup", "KeyA");
    dispatchKeyboardEvent(target, "keydown", "ArrowRight");
    expect(keyboard.state).toEqual({
      left: false,
      right: true,
      fire: false,
    });

    dispatchKeyboardEvent(target, "keyup", "ArrowRight");
    dispatchKeyboardEvent(target, "keydown", "KeyD");
    expect(keyboard.state).toEqual({
      left: false,
      right: true,
      fire: false,
    });

    dispatchKeyboardEvent(target, "keyup", "KeyD");
    dispatchKeyboardEvent(target, "keydown", "Space");
    expect(keyboard.state).toEqual({
      left: false,
      right: false,
      fire: true,
    });
    expect(keyboard.sample()).toEqual({
      moveAxis: 0,
      fire: true,
      pause: false,
    });

    dispatchKeyboardEvent(target, "keyup", "Space");
    expect(keyboard.state).toEqual({
      left: false,
      right: false,
      fire: false,
    });

    keyboard.dispose();
  });

  it("keeps state active during repeated keydown events and overlapping bindings", () => {
    const target = new EventTarget();
    const keyboard = new KeyboardInput(target);

    dispatchKeyboardEvent(target, "keydown", "ArrowRight");
    dispatchKeyboardEvent(target, "keydown", "ArrowRight", { repeat: true });
    dispatchKeyboardEvent(target, "keydown", "KeyD");

    expect(keyboard.state.right).toBe(true);

    dispatchKeyboardEvent(target, "keyup", "ArrowRight");
    expect(keyboard.state.right).toBe(true);

    dispatchKeyboardEvent(target, "keyup", "KeyD");
    expect(keyboard.state.right).toBe(false);

    keyboard.dispose();
  });

  it("ignores unmapped keys", () => {
    const target = new EventTarget();
    const keyboard = new KeyboardInput(target);

    expect(keyboard.state).toEqual({
      left: false,
      right: false,
      fire: false,
    });

    dispatchKeyboardEvent(target, "keydown", "Enter");
    dispatchKeyboardEvent(target, "keyup", "Escape");

    expect(keyboard.state).toEqual({
      left: false,
      right: false,
      fire: false,
    });
    expect(keyboard.read()).toEqual({
      moveAxis: 0,
      fire: false,
      pause: false,
    });

    keyboard.dispose();
  });

  it("stops mutating state after dispose removes the listeners", () => {
    const target = new EventTarget();
    const keyboard = new KeyboardInput(target);

    dispatchKeyboardEvent(target, "keydown", "ArrowLeft");
    expect(keyboard.state.left).toBe(true);

    keyboard.dispose();

    dispatchKeyboardEvent(target, "keyup", "ArrowLeft");
    dispatchKeyboardEvent(target, "keydown", "Space");

    expect(keyboard.state).toEqual({
      left: true,
      right: false,
      fire: false,
    });
  });
});
