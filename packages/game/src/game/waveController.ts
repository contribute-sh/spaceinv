export interface WaveConfig {
  alienRowCount: number;
  marchSpeedMultiplier: number;
  fireCadenceMs: number;
}

const INITIAL_WAVE = 1;
const INITIAL_ALIEN_ROW_COUNT = 3;
const MAX_ALIEN_ROW_COUNT = 8;
const WAVES_PER_ROW_INCREASE = 3;
const INITIAL_MARCH_SPEED_MULTIPLIER = 1;
const MARCH_SPEED_STEP = 0.15;
const INITIAL_FIRE_CADENCE_MS = 1600;
const MIN_FIRE_CADENCE_MS = 400;
const FIRE_CADENCE_STEP_MS = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function deriveWaveConfig(wave: number): WaveConfig {
  const normalizedWave = Math.max(INITIAL_WAVE, Math.floor(wave));
  const progression = normalizedWave - INITIAL_WAVE;

  return {
    alienRowCount: clamp(
      INITIAL_ALIEN_ROW_COUNT +
        Math.floor(progression / WAVES_PER_ROW_INCREASE),
      INITIAL_ALIEN_ROW_COUNT,
      MAX_ALIEN_ROW_COUNT,
    ),
    marchSpeedMultiplier: Number(
      (
        INITIAL_MARCH_SPEED_MULTIPLIER +
        progression * MARCH_SPEED_STEP
      ).toFixed(2),
    ),
    fireCadenceMs: clamp(
      INITIAL_FIRE_CADENCE_MS - progression * FIRE_CADENCE_STEP_MS,
      MIN_FIRE_CADENCE_MS,
      INITIAL_FIRE_CADENCE_MS,
    ),
  };
}

export function createWaveController() {
  let wave = INITIAL_WAVE;

  return {
    getWave(): number {
      return wave;
    },
    getConfig(): WaveConfig {
      return deriveWaveConfig(wave);
    },
    advance(): void {
      wave += 1;
    },
    reset(): void {
      wave = INITIAL_WAVE;
    },
  };
}
