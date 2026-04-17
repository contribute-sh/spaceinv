function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return "code" in event && typeof event.code === "string";
}

function resolveDefaultTarget(): EventTarget {
  if (typeof window !== "undefined") {
    return window;
  }

  throw new Error(
    "InputManager requires an EventTarget when window is unavailable",
  );
}

export class InputManager {
  private readonly downCodes = new Set<string>();
  private readonly pressedCodes = new Set<string>();
  private listening = false;

  private readonly keydownListener = (event: Event): void => {
    if (!isKeyboardEvent(event)) {
      return;
    }

    if (!this.downCodes.has(event.code)) {
      this.pressedCodes.add(event.code);
    }

    this.downCodes.add(event.code);
  };

  private readonly keyupListener = (event: Event): void => {
    if (!isKeyboardEvent(event)) {
      return;
    }

    this.downCodes.delete(event.code);
    this.pressedCodes.delete(event.code);
  };

  constructor(private readonly target: EventTarget = resolveDefaultTarget()) {}

  start(): void {
    if (this.listening) {
      return;
    }

    this.target.addEventListener("keydown", this.keydownListener);
    this.target.addEventListener("keyup", this.keyupListener);
    this.listening = true;
  }

  stop(): void {
    if (!this.listening) {
      return;
    }

    this.target.removeEventListener("keydown", this.keydownListener);
    this.target.removeEventListener("keyup", this.keyupListener);
    this.listening = false;
    this.downCodes.clear();
    this.pressedCodes.clear();
  }

  isDown(code: string): boolean {
    return this.downCodes.has(code);
  }

  wasPressed(code: string): boolean {
    if (!this.pressedCodes.has(code)) {
      return false;
    }

    this.pressedCodes.delete(code);

    return true;
  }

  update(): void {
    this.pressedCodes.clear();
  }
}
