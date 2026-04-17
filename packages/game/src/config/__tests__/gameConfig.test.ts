import { describe, expect, it } from "vitest";
import { GameConfig } from "../gameConfig";

function collectNumericLeaves(value: unknown): number[] {
  if (typeof value === "number") {
    return [value];
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  return Object.values(value as Record<string, unknown>).flatMap((entry) =>
    collectNumericLeaves(entry),
  );
}

describe("GameConfig", () => {
  it("freezes the top-level config and every section object", () => {
    expect(Object.isFrozen(GameConfig)).toBe(true);

    for (const section of Object.values(GameConfig)) {
      expect(Object.isFrozen(section)).toBe(true);
    }
  });

  it("uses positive finite numeric values for every tuning knob", () => {
    for (const value of collectNumericLeaves(GameConfig)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it("defines the alien grid with positive integer dimensions", () => {
    expect(Number.isInteger(GameConfig.grid.rows)).toBe(true);
    expect(Number.isInteger(GameConfig.grid.cols)).toBe(true);
    expect(GameConfig.grid.rows).toBeGreaterThan(0);
    expect(GameConfig.grid.cols).toBeGreaterThan(0);
  });

  it("keeps the fixed update step at a reasonable tick rate", () => {
    expect(GameConfig.timestep.fixedDeltaSeconds).toBeLessThanOrEqual(1 / 30);
  });
});
