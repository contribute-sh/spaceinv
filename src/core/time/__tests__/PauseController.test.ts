import { describe, expect, it, vi } from "vitest";

import {
  PauseController,
  type PauseControllerDocumentTarget,
  type PauseControllerWindowTarget,
} from "../PauseController";

type MockEventTarget = Pick<
  EventTarget,
  "addEventListener" | "dispatchEvent" | "removeEventListener"
>;

type MockDocumentTarget = PauseControllerDocumentTarget & {
  dispatchEvent: MockEventTarget["dispatchEvent"];
  visibilityState: DocumentVisibilityState;
};

type MockWindowTarget = PauseControllerWindowTarget & {
  dispatchEvent: MockEventTarget["dispatchEvent"];
};

function createMockEventTarget(): MockEventTarget {
  const eventTarget = new EventTarget();

  return {
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
  };
}

function createMockDocument(
  visibilityState: DocumentVisibilityState = "visible",
): MockDocumentTarget {
  return {
    ...createMockEventTarget(),
    visibilityState,
  };
}

function createMockWindow(): MockWindowTarget {
  return createMockEventTarget();
}

function createController(
  visibilityState: DocumentVisibilityState = "visible",
) {
  const documentTarget = createMockDocument(visibilityState);
  const windowTarget = createMockWindow();
  const onPause = vi.fn();
  const onResume = vi.fn();
  const controller = new PauseController({
    document: documentTarget,
    onPause,
    onResume,
    window: windowTarget,
  });

  return {
    controller,
    documentTarget,
    onPause,
    onResume,
    windowTarget,
  };
}

describe("PauseController", () => {
  it("pauses when the document becomes hidden and resumes when visible again", () => {
    const { controller, documentTarget, onPause, onResume } =
      createController();

    controller.start();

    expect(controller.isPaused()).toBe(false);

    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));

    expect(controller.isPaused()).toBe(true);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();

    documentTarget.visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));

    expect(controller.isPaused()).toBe(false);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("requires visibility and focus to resume and debounces duplicate transitions", () => {
    const { controller, documentTarget, onPause, onResume, windowTarget } =
      createController();

    controller.start();

    windowTarget.dispatchEvent(new Event("blur"));
    windowTarget.dispatchEvent(new Event("blur"));

    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));

    expect(controller.isPaused()).toBe(true);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();

    windowTarget.dispatchEvent(new Event("focus"));

    expect(controller.isPaused()).toBe(true);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();

    documentTarget.visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    windowTarget.dispatchEvent(new Event("focus"));

    expect(controller.isPaused()).toBe(false);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("removes event listeners when stopped", () => {
    const { controller, documentTarget, onPause, onResume, windowTarget } =
      createController();

    controller.start();
    windowTarget.dispatchEvent(new Event("blur"));

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(controller.isPaused()).toBe(true);

    controller.stop();

    documentTarget.visibilityState = "visible";
    windowTarget.dispatchEvent(new Event("focus"));
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    windowTarget.dispatchEvent(new Event("blur"));

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
    expect(controller.isPaused()).toBe(true);
  });
});
