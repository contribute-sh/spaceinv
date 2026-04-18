type PauseControllerEventTarget = Pick<
  EventTarget,
  "addEventListener" | "removeEventListener"
>;

export type PauseControllerDocumentTarget = PauseControllerEventTarget & {
  visibilityState: DocumentVisibilityState;
};

export type PauseControllerWindowTarget = PauseControllerEventTarget;

export type PauseControllerOptions = {
  onPause: () => void;
  onResume: () => void;
  document?: PauseControllerDocumentTarget;
  window?: PauseControllerWindowTarget;
};

function getDefaultDocument(): PauseControllerDocumentTarget | undefined {
  return (globalThis as { document?: PauseControllerDocumentTarget }).document;
}

function getDefaultWindow(): PauseControllerWindowTarget | undefined {
  return (globalThis as { window?: PauseControllerWindowTarget }).window;
}

export class PauseController {
  private paused: boolean;
  private started = false;
  private windowBlurred = false;

  private readonly onPause: () => void;
  private readonly onResume: () => void;
  private readonly documentTarget: PauseControllerDocumentTarget | undefined;
  private readonly windowTarget: PauseControllerWindowTarget | undefined;

  public constructor(options: PauseControllerOptions) {
    this.onPause = options.onPause;
    this.onResume = options.onResume;
    this.documentTarget = options.document ?? getDefaultDocument();
    this.windowTarget = options.window ?? getDefaultWindow();
    this.paused = this.documentTarget?.visibilityState === "hidden";
  }

  public start(): void {
    if (this.started) {
      return;
    }

    if (!this.documentTarget) {
      throw new Error("PauseController requires a document target.");
    }

    if (!this.windowTarget) {
      throw new Error("PauseController requires a window target.");
    }

    this.started = true;
    this.windowBlurred = false;
    this.paused = this.documentTarget.visibilityState === "hidden";
    this.documentTarget.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.windowTarget.addEventListener("blur", this.handleBlur);
    this.windowTarget.addEventListener("focus", this.handleFocus);
  }

  public stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.documentTarget?.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.windowTarget?.removeEventListener("blur", this.handleBlur);
    this.windowTarget?.removeEventListener("focus", this.handleFocus);
  }

  public isPaused(): boolean {
    return this.paused;
  }

  private readonly handleVisibilityChange = (): void => {
    this.syncPausedState();
  };

  private readonly handleBlur = (): void => {
    this.windowBlurred = true;
    this.pause();
  };

  private readonly handleFocus = (): void => {
    this.windowBlurred = false;

    if (this.documentTarget?.visibilityState === "visible") {
      this.resume();
    }
  };

  private syncPausedState(): void {
    if (!this.documentTarget) {
      return;
    }

    if (
      this.documentTarget.visibilityState === "hidden" ||
      this.windowBlurred
    ) {
      this.pause();
      return;
    }

    if (this.documentTarget.visibilityState === "visible") {
      this.resume();
    }
  }

  private pause(): void {
    if (this.paused) {
      return;
    }

    this.paused = true;
    this.onPause();
  }

  private resume(): void {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    this.onResume();
  }
}
