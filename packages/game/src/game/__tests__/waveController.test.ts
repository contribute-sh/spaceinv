import { describe, expect, it } from "vitest";

import { createWaveController } from "../waveController";

function advanceToWave(targetWave: number) {
  const controller = createWaveController();

  while (controller.getWave() < targetWave) {
    controller.advance();
  }

  return controller;
}

describe("waveController", () => {
  it("starts on wave one with the initial difficulty config", () => {
    const controller = createWaveController();

    expect(controller.getWave()).toBe(1);
    expect(controller.getConfig()).toEqual({
      alienRowCount: 3,
      marchSpeedMultiplier: 1,
      fireCadenceMs: 1600,
    });
  });

  it("advances to progressively harder waves", () => {
    const controller = createWaveController();
    let previousConfig = controller.getConfig();
    const initialRowCount = previousConfig.alienRowCount;

    for (let expectedWave = 2; expectedWave <= 12; expectedWave += 1) {
      controller.advance();

      const config = controller.getConfig();

      expect(controller.getWave()).toBe(expectedWave);
      expect(config.alienRowCount).toBeGreaterThanOrEqual(
        previousConfig.alienRowCount,
      );
      expect(config.marchSpeedMultiplier).toBeGreaterThan(
        previousConfig.marchSpeedMultiplier,
      );
      expect(config.fireCadenceMs).toBeLessThan(previousConfig.fireCadenceMs);

      previousConfig = config;
    }

    expect(previousConfig.alienRowCount).toBeGreaterThan(initialRowCount);
  });

  it("resets the wave index and config after progressing", () => {
    const controller = advanceToWave(7);

    expect(controller.getWave()).toBe(7);

    controller.reset();

    expect(controller.getWave()).toBe(1);
    expect(controller.getConfig()).toEqual({
      alienRowCount: 3,
      marchSpeedMultiplier: 1,
      fireCadenceMs: 1600,
    });
  });

  it("derives the same config for the same wave across controller instances", () => {
    const firstController = advanceToWave(9);
    const secondController = advanceToWave(9);

    expect(firstController.getWave()).toBe(9);
    expect(secondController.getWave()).toBe(9);
    expect(firstController.getConfig()).toEqual(secondController.getConfig());
  });

  it("holds the row-count ceiling and fire-cadence floor on high waves", () => {
    const controller = advanceToWave(40);
    const highWaveConfig = controller.getConfig();

    expect(highWaveConfig.alienRowCount).toBe(8);
    expect(highWaveConfig.fireCadenceMs).toBe(400);

    controller.advance();

    const nextConfig = controller.getConfig();

    expect(nextConfig.alienRowCount).toBe(8);
    expect(nextConfig.fireCadenceMs).toBe(400);
    expect(nextConfig.marchSpeedMultiplier).toBeGreaterThan(
      highWaveConfig.marchSpeedMultiplier,
    );
  });
});
