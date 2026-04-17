const UINT32_RANGE = 4294967296;
const MULBERRY32_INCREMENT = 0x6d2b79f5;

export type RngState = number;

export interface Rng {
  getState(): RngState;
  next(): number;
  nextInt(min: number, max: number): number;
  nextRange(min: number, max: number): number;
  restore(state: RngState): void;
  save(): RngState;
  setState(state: RngState): void;
}

export function createRng(seed: number): Rng {
  let state = normalizeSeed(seed);

  const getState = (): RngState => state;
  const setState = (nextState: RngState): void => {
    state = normalizeSeed(nextState);
  };

  const next = (): number => {
    state = (state + MULBERRY32_INCREMENT) >>> 0;

    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };

  return {
    getState,
    next,
    nextInt(min: number, max: number): number {
      const lower = Math.ceil(Math.min(min, max));
      const upper = Math.floor(Math.max(min, max));

      if (upper <= lower) {
        return lower;
      }

      return Math.floor(next() * (upper - lower)) + lower;
    },
    nextRange(min: number, max: number): number {
      const lower = Math.min(min, max);
      const upper = Math.max(min, max);

      if (upper === lower) {
        return lower;
      }

      return lower + next() * (upper - lower);
    },
    restore(stateToRestore: RngState): void {
      setState(stateToRestore);
    },
    save(): RngState {
      return getState();
    },
    setState,
  };
}

export function createFrameRng(baseSeed: number, frameIndex: number): Rng {
  return createRng(deriveFrameSeed(baseSeed, frameIndex));
}

export function deriveFrameSeed(baseSeed: number, frameIndex: number): number {
  let state = normalizeSeed(baseSeed) ^ 0x9e3779b9;
  state = (state + Math.imul(normalizeSeed(frameIndex), 0x85ebca6b)) >>> 0;
  state ^= state >>> 16;
  state = Math.imul(state, 0x21f0aaad) >>> 0;
  state ^= state >>> 15;
  state = Math.imul(state, 0x735a2d97) >>> 0;

  return (state ^ (state >>> 15)) >>> 0;
}

export const rng = createRng(0);

function normalizeSeed(seed: number): number {
  return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
}
