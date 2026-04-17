import { describe, expect, it } from "vitest";

import {
  createScoreState,
  recordKill,
  type AlienType,
  POINTS_BY_TYPE,
} from "../score";

describe("score", () => {
  it("creates a fresh state with zero totals for all alien types", () => {
    expect(createScoreState()).toEqual({
      total: 0,
      byType: {
        small: 0,
        medium: 0,
        large: 0,
      },
    });
  });

  it("increments the total and matching alien type count", () => {
    const nextState = recordKill(createScoreState(), "small");

    expect(nextState).toEqual({
      total: POINTS_BY_TYPE.small,
      byType: {
        small: 1,
        medium: 0,
        large: 0,
      },
    });
  });

  it("accumulates totals and counts across varied kill sequences", () => {
    const killOrder: AlienType[] = ["small", "large", "medium", "small"];

    const finalState = killOrder.reduce(recordKill, createScoreState());

    expect(finalState).toEqual({
      total: 90,
      byType: {
        small: 2,
        medium: 1,
        large: 1,
      },
    });
  });

  it("does not mutate the input state", () => {
    const initialState = createScoreState();
    const initialByType = initialState.byType;

    const nextState = recordKill(initialState, "medium");

    expect(nextState).not.toBe(initialState);
    expect(nextState.byType).not.toBe(initialByType);
    expect(initialState).toEqual({
      total: 0,
      byType: {
        small: 0,
        medium: 0,
        large: 0,
      },
    });
    expect(initialState.byType).toBe(initialByType);
  });

  it("produces the same final state for the same kill sequence", () => {
    const killOrder: AlienType[] = ["large", "small", "small", "medium"];

    const firstRun = killOrder.reduce(recordKill, createScoreState());
    const secondRun = killOrder.reduce(recordKill, createScoreState());

    expect(firstRun).toEqual(secondRun);
  });
});
