import { afterEach, describe, expect, it } from "vitest";

import { InputManager } from "../inputManager";

function dispatchKeyboardEvent(
  target: EventTarget,
  type: "keydown" | "keyup",
  code: string,
  options: KeyboardEventInit = {},
): void {
  target.dispatchEvent(
    new KeyboardEvent(type, {
      ...options,
      bubbles: true,
      code,
    }),
  );
}

const activeManagers: InputManager[] = [];

function trackManager(manager: InputManager): InputManager {
  activeManagers.push(manager);

  return manager;
}

afterEach(() => {
  while (activeManagers.length > 0) {
    activeManagers.pop()?.stop();
  }
});

describe("InputManager", () => {
  it("tracks held keys on the default window target", () => {
    const inputManager = trackManager(new InputManager());

    inputManager.start();

    dispatchKeyboardEvent(window, "keydown", "ArrowLeft");
    expect(inputManager.isDown("ArrowLeft")).toBe(true);
    expect(inputManager.isDown("Space")).toBe(false);

    dispatchKeyboardEvent(window, "keyup", "ArrowLeft");
    expect(inputManager.isDown("ArrowLeft")).toBe(false);
  });

  it("uses an injected target and only listens after start", () => {
    const target = new EventTarget();
    const inputManager = trackManager(new InputManager(target));

    dispatchKeyboardEvent(target, "keydown", "ArrowRight");
    expect(inputManager.isDown("ArrowRight")).toBe(false);

    inputManager.start();

    dispatchKeyboardEvent(target, "keydown", "ArrowRight");
    expect(inputManager.isDown("ArrowRight")).toBe(true);

    dispatchKeyboardEvent(target, "keyup", "ArrowRight");
    expect(inputManager.isDown("ArrowRight")).toBe(false);
  });

  it("reports key presses once per keydown edge and ignores auto-repeat", () => {
    const inputManager = trackManager(new InputManager());

    inputManager.start();

    dispatchKeyboardEvent(window, "keydown", "Space");
    expect(inputManager.wasPressed("Space")).toBe(true);
    expect(inputManager.wasPressed("Space")).toBe(false);

    dispatchKeyboardEvent(window, "keydown", "Space", { repeat: true });
    expect(inputManager.isDown("Space")).toBe(true);
    expect(inputManager.wasPressed("Space")).toBe(false);

    dispatchKeyboardEvent(window, "keyup", "Space");
    expect(inputManager.isDown("Space")).toBe(false);
    expect(inputManager.wasPressed("Space")).toBe(false);

    dispatchKeyboardEvent(window, "keydown", "Space");
    expect(inputManager.wasPressed("Space")).toBe(true);
  });

  it("clears pending press edges during update without changing held state", () => {
    const inputManager = trackManager(new InputManager());

    inputManager.start();

    dispatchKeyboardEvent(window, "keydown", "KeyA");
    expect(inputManager.isDown("KeyA")).toBe(true);

    inputManager.update();
    expect(inputManager.wasPressed("KeyA")).toBe(false);

    dispatchKeyboardEvent(window, "keyup", "KeyA");
    expect(inputManager.isDown("KeyA")).toBe(false);
  });

  it("detaches listeners and resets state on stop", () => {
    const target = new EventTarget();
    const inputManager = trackManager(new InputManager(target));

    inputManager.start();

    dispatchKeyboardEvent(target, "keydown", "ArrowLeft");
    expect(inputManager.isDown("ArrowLeft")).toBe(true);
    expect(inputManager.wasPressed("ArrowLeft")).toBe(true);

    inputManager.stop();

    dispatchKeyboardEvent(target, "keyup", "ArrowLeft");
    dispatchKeyboardEvent(target, "keydown", "Space");

    expect(inputManager.isDown("ArrowLeft")).toBe(false);
    expect(inputManager.isDown("Space")).toBe(false);
    expect(inputManager.wasPressed("Space")).toBe(false);
  });
});
