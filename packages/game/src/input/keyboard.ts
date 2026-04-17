import type { InputSource, InputState } from "./inputMap";

export type KeyboardState = {
  left: boolean;
  right: boolean;
  fire: boolean;
};

const ACTION_CODES = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  fire: ["Space"],
} as const;

type KeyboardAction = keyof typeof ACTION_CODES;
type KeyboardCode = (typeof ACTION_CODES)[KeyboardAction][number];

const CODE_ACTIONS: Record<KeyboardCode, KeyboardAction> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "fire",
};

const NEUTRAL_KEYBOARD_STATE: KeyboardState = {
  left: false,
  right: false,
  fire: false,
};

function isKeyboardCode(code: string): code is KeyboardCode {
  return code in CODE_ACTIONS;
}

function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return "code" in event;
}

function resolveDefaultTarget(): EventTarget {
  if (typeof window !== "undefined") {
    return window;
  }

  if (typeof document !== "undefined") {
    return document;
  }

  throw new Error(
    "KeyboardInput requires an EventTarget when window and document are unavailable"
  );
}

export class KeyboardInput implements InputSource {
  private readonly pressedCodes = new Set<KeyboardCode>();
  private readonly keydownListener: (event: Event) => void;
  private readonly keyupListener: (event: Event) => void;
  private currentState: KeyboardState = { ...NEUTRAL_KEYBOARD_STATE };

  constructor(private readonly target: EventTarget = resolveDefaultTarget()) {
    this.keydownListener = (event: Event): void => {
      this.handleKeyboardEvent(event, true);
    };
    this.keyupListener = (event: Event): void => {
      this.handleKeyboardEvent(event, false);
    };

    this.target.addEventListener("keydown", this.keydownListener);
    this.target.addEventListener("keyup", this.keyupListener);
  }

  get state(): KeyboardState {
    return { ...this.currentState };
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.keydownListener);
    this.target.removeEventListener("keyup", this.keyupListener);
  }

  read(): InputState {
    return {
      moveAxis: Number(this.currentState.right) - Number(this.currentState.left),
      fire: this.currentState.fire,
      pause: false,
    };
  }

  sample(): InputState {
    return this.read();
  }

  private handleKeyboardEvent(event: Event, isPressed: boolean): void {
    if (!isKeyboardEvent(event) || !isKeyboardCode(event.code)) {
      return;
    }

    if (isPressed) {
      this.pressedCodes.add(event.code);
    } else {
      this.pressedCodes.delete(event.code);
    }

    this.currentState = {
      left: ACTION_CODES.left.some((code) => this.pressedCodes.has(code)),
      right: ACTION_CODES.right.some((code) => this.pressedCodes.has(code)),
      fire: ACTION_CODES.fire.some((code) => this.pressedCodes.has(code)),
    };
  }
}
