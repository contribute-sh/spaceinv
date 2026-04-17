export type InputState = {
  moveAxis: number;
  fire: boolean;
  pause: boolean;
};

export type InputStateSnapshot = Partial<InputState> | null | undefined;

export type InputSource = {
  read?: () => InputStateSnapshot;
  sample?: () => InputStateSnapshot;
};

export type CreateInputMapOptions = {
  keyboard?: InputSource | null;
  touch?: InputSource | null;
  gamepad?: InputSource | null;
};

export type InputMap = {
  read: () => InputState;
  sample: () => InputState;
};

const NEUTRAL_INPUT_STATE: InputState = {
  moveAxis: 0,
  fire: false,
  pause: false,
};

type SourceName = keyof CreateInputMapOptions;

type RankedSource = {
  name: SourceName;
  priority: number;
  source?: InputSource | null;
};

const RANKED_SOURCES: RankedSource[] = [
  { name: "keyboard", priority: 0 },
  { name: "touch", priority: 1 },
  { name: "gamepad", priority: 2 },
];

function readSourceSnapshot(source?: InputSource | null): InputStateSnapshot {
  if (!source) {
    return undefined;
  }

  const read =
    typeof source.read === "function"
      ? source.read.bind(source)
      : typeof source.sample === "function"
        ? source.sample.bind(source)
        : undefined;

  if (!read) {
    return undefined;
  }

  try {
    return read();
  } catch {
    return undefined;
  }
}

function normalizeMoveAxis(moveAxis?: number): number {
  if (typeof moveAxis !== "number" || !Number.isFinite(moveAxis)) {
    return 0;
  }

  return moveAxis;
}

function normalizeFlag(flag?: boolean): boolean {
  return flag === true;
}

export function createInputMap(options: CreateInputMapOptions): InputMap {
  const read = (): InputState => {
    let selectedMoveAxis = 0;
    let selectedMagnitude = 0;
    let selectedPriority = -1;
    let fire = false;
    let pause = false;

    for (const rankedSource of RANKED_SOURCES) {
      const snapshot = readSourceSnapshot(options[rankedSource.name]);

      if (!snapshot) {
        continue;
      }

      const moveAxis = normalizeMoveAxis(snapshot.moveAxis);
      const magnitude = Math.abs(moveAxis);

      if (
        magnitude > selectedMagnitude ||
        (magnitude === selectedMagnitude &&
          rankedSource.priority > selectedPriority)
      ) {
        selectedMoveAxis = moveAxis;
        selectedMagnitude = magnitude;
        selectedPriority = rankedSource.priority;
      }

      fire = fire || normalizeFlag(snapshot.fire);
      pause = pause || normalizeFlag(snapshot.pause);
    }

    if (selectedMagnitude === 0 && !fire && !pause) {
      return { ...NEUTRAL_INPUT_STATE };
    }

    return {
      moveAxis: selectedMoveAxis,
      fire,
      pause,
    };
  };

  return {
    read,
    sample: read,
  };
}
