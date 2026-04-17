import { describe, expect, it } from "vitest";

import { createInputMap, type InputSource } from "../inputMap";

function createSource(snapshot: {
  moveAxis?: number;
  fire?: boolean;
  pause?: boolean;
}): InputSource {
  return {
    read: () => snapshot,
  };
}

describe("inputMap", () => {
  it("prefers the largest axis magnitude and uses gamepad > touch > keyboard to break ties", () => {
    const inputMap = createInputMap({
      keyboard: createSource({ moveAxis: 0.75 }),
      touch: createSource({ moveAxis: -0.75 }),
      gamepad: createSource({ moveAxis: 0.75 }),
    });

    expect(inputMap.sample()).toEqual({
      moveAxis: 0.75,
      fire: false,
      pause: false,
    });
  });

  it("ORs fire and pause across all available sources", () => {
    const inputMap = createInputMap({
      keyboard: createSource({ fire: true }),
      touch: createSource({ pause: true }),
      gamepad: createSource({ moveAxis: 0.2, fire: false, pause: false }),
    });

    expect(inputMap.read()).toEqual({
      moveAxis: 0.2,
      fire: true,
      pause: true,
    });
  });

  it("returns the neutral input state when every source is idle", () => {
    const inputMap = createInputMap({
      keyboard: createSource({ moveAxis: 0, fire: false, pause: false }),
      touch: createSource({}),
      gamepad: createSource({ moveAxis: 0 }),
    });

    expect(inputMap.read()).toEqual({
      moveAxis: 0,
      fire: false,
      pause: false,
    });
  });

  it("ignores missing and failing sources while still reading the others", () => {
    const inputMap = createInputMap({
      keyboard: {
        read() {
          throw new Error("keyboard disconnected");
        },
      },
      gamepad: {
        sample: () => ({
          moveAxis: -1,
          fire: true,
          pause: false,
        }),
      },
    });

    expect(inputMap.sample()).toEqual({
      moveAxis: -1,
      fire: true,
      pause: false,
    });
  });
});
