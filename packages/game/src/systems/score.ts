export type AlienType = "small" | "medium" | "large";

export interface ScoreState {
  total: number;
  byType: Record<AlienType, number>;
}

export const POINTS_BY_TYPE = Object.freeze({
  small: 30,
  medium: 20,
  large: 10,
} satisfies Record<AlienType, number>);

export function createScoreState(): ScoreState {
  return {
    total: 0,
    byType: {
      small: 0,
      medium: 0,
      large: 0,
    },
  };
}

export function recordKill(
  state: ScoreState,
  alienType: AlienType,
): ScoreState {
  return {
    total: state.total + POINTS_BY_TYPE[alienType],
    byType: {
      ...state.byType,
      [alienType]: state.byType[alienType] + 1,
    },
  };
}
