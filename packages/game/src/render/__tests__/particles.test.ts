import { describe, expect, it } from "vitest";

import { ParticleSystem, type Particle } from "../particles";

type DrawOperation = {
  alpha: number;
  color: string | CanvasGradient | CanvasPattern;
  height: number;
  width: number;
  x: number;
  y: number;
};

class MockCanvasContext {
  public readonly operations: DrawOperation[] = [];
  public fillStyle: string | CanvasGradient | CanvasPattern = "";
  public globalAlpha = 1;

  fillRect(x: number, y: number, width: number, height: number): void {
    this.operations.push({
      alpha: this.globalAlpha,
      color: this.fillStyle,
      height,
      width,
      x,
      y,
    });
  }
}

function drawOperations(system: ParticleSystem): DrawOperation[] {
  const ctx = new MockCanvasContext();

  system.draw(ctx as unknown as CanvasRenderingContext2D);

  return ctx.operations;
}

function drawSingleAlpha(system: ParticleSystem): number {
  const [operation] = drawOperations(system);

  if (!operation) {
    throw new Error("Expected exactly one draw operation.");
  }

  return operation.alpha;
}

function getOnlyActiveParticle(system: ParticleSystem): Particle {
  const activeParticles = system.particles.filter(
    (particle) => particle.active,
  );
  const [particle] = activeParticles;

  if (!particle) {
    throw new Error("Expected exactly one active particle.");
  }

  expect(activeParticles).toHaveLength(1);

  return particle;
}

function snapshot(system: ParticleSystem): Array<Omit<Particle, "active">> {
  return system.particles
    .filter((particle) => particle.active)
    .map((particle) => ({
      age: particle.age,
      alpha: particle.alpha,
      ax: particle.ax,
      ay: particle.ay,
      color: particle.color,
      lifetime: particle.lifetime,
      size: particle.size,
      vx: particle.vx,
      vy: particle.vy,
      x: particle.x,
      y: particle.y,
    }));
}

describe("ParticleSystem", () => {
  it("reuses expired slots and recycles the oldest active slot at capacity", () => {
    const system = new ParticleSystem(2);

    system.spawn(1, 1, {
      lifetime: 1,
    });
    system.spawn(2, 2, {
      lifetime: 10,
    });

    expect(system.particles).toHaveLength(2);
    expect(system.activeCount).toBe(2);

    system.update(1);

    expect(system.activeCount).toBe(1);

    system.spawn(3, 3, {
      lifetime: 10,
    });

    expect(system.activeCount).toBe(2);
    expect(
      drawOperations(system).map(({ x, y }) => ({
        x,
        y,
      })),
    ).toEqual([
      { x: 3, y: 3 },
      { x: 2, y: 2 },
    ]);

    system.spawn(4, 4, {
      lifetime: 10,
    });

    expect(system.activeCount).toBe(2);
    expect(
      drawOperations(system).map(({ x, y }) => ({
        x,
        y,
      })),
    ).toEqual([
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ]);
  });

  it("marks particles inactive when age reaches their lifetime", () => {
    const system = new ParticleSystem(1);

    system.spawn(10, 20, {
      lifetime: 1,
    });

    expect(system.activeCount).toBe(1);

    system.update(1);

    expect(system.activeCount).toBe(0);
    expect(drawOperations(system)).toEqual([]);
  });

  it("produces bit-equal state across identical update runs", () => {
    const first = new ParticleSystem(3);
    const second = new ParticleSystem(3);
    const spawns = [
      {
        options: {
          ax: 0.5,
          ay: 9.8,
          color: "#ffcc00",
          lifetime: 5,
          size: 3,
          vx: 12,
          vy: -8,
        },
        x: 4,
        y: 8,
      },
      {
        options: {
          ax: -1.25,
          ay: 4,
          color: "#66ddff",
          lifetime: 3.5,
          size: 2,
          vx: -6,
          vy: 10,
        },
        x: -2,
        y: 16,
      },
    ];
    const steps = [0.016, 0.016, 0.05, 0.125, 0.25];

    for (const spawn of spawns) {
      first.spawn(spawn.x, spawn.y, spawn.options);
      second.spawn(spawn.x, spawn.y, spawn.options);
    }

    for (const dt of steps) {
      first.update(dt);
      second.update(dt);
    }

    expect(snapshot(first)).toEqual(snapshot(second));
  });

  it("accelerates particles downward when y-acceleration is positive", () => {
    const system = new ParticleSystem(1);

    system.spawn(5, 10, {
      ay: 8,
      lifetime: 10,
      vy: 0,
    });

    system.update(0.5);

    const firstY = getOnlyActiveParticle(system).y;
    const firstVy = getOnlyActiveParticle(system).vy;

    system.update(0.5);

    const particle = getOnlyActiveParticle(system);

    expect(particle.y).toBeGreaterThan(firstY);
    expect(particle.vy).toBeGreaterThan(firstVy);
  });

  it("fades alpha monotonically from one toward zero over the lifetime", () => {
    const system = new ParticleSystem(1);

    system.spawn(0, 0, {
      color: "#ff5500",
      lifetime: 2,
      size: 4,
    });

    const alphas = [drawSingleAlpha(system)];

    system.update(0.5);
    alphas.push(drawSingleAlpha(system));

    system.update(0.5);
    alphas.push(drawSingleAlpha(system));

    system.update(0.5);
    alphas.push(drawSingleAlpha(system));

    expect(alphas).toEqual([1, 0.75, 0.5, 0.25]);

    for (let index = 1; index < alphas.length; index += 1) {
      expect(alphas[index]).toBeLessThan(alphas[index - 1]);
    }
  });
});
