const MIN_LAYER_COUNT = 3;
const FULL_CIRCLE_RADIANS = Math.PI * 2;

interface Star {
  x: number;
  y: number;
  size: number;
}

interface StarLayer {
  alpha: number;
  drawMode: "arc" | "rect";
  speedX: number;
  speedY: number;
  stars: Star[];
}

export interface CreateStarfieldOptions {
  height: number;
  layers?: number;
  seed?: number;
  width: number;
}

export interface Starfield {
  render(ctx: CanvasRenderingContext2D): void;
  update(deltaSeconds: number): void;
}

export function createStarfield(options: CreateStarfieldOptions): Starfield {
  const width = normalizeDimension(options.width);
  const height = normalizeDimension(options.height);
  const layerCount = normalizeLayerCount(options.layers);
  const random = createMulberry32(options.seed ?? 0);
  const starLayers = createLayers(width, height, layerCount, random);

  return {
    render(ctx: CanvasRenderingContext2D): void {
      const supportsArcDrawing =
        typeof ctx.arc === "function" &&
        typeof ctx.beginPath === "function" &&
        typeof ctx.fill === "function";

      for (const layer of starLayers) {
        ctx.fillStyle = `rgba(255, 255, 255, ${layer.alpha})`;

        for (const star of layer.stars) {
          if (layer.drawMode === "rect" || !supportsArcDrawing) {
            ctx.fillRect(star.x, star.y, star.size, star.size);
            continue;
          }

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.5, 0, FULL_CIRCLE_RADIANS);
          ctx.fill();
        }
      }
    },
    update(deltaSeconds: number): void {
      for (const layer of starLayers) {
        for (const star of layer.stars) {
          star.x = wrapCoordinate(star.x + layer.speedX * deltaSeconds, width);
          star.y = wrapCoordinate(star.y + layer.speedY * deltaSeconds, height);
        }
      }
    }
  };
}

function createLayers(
  width: number,
  height: number,
  layerCount: number,
  random: () => number
): StarLayer[] {
  const baseStarCount = Math.max(6, Math.round((width * height) / 5000));
  const layers: StarLayer[] = [];

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const starCount = baseStarCount + (layerCount - layerIndex - 1) * 3;
    const baseSize = 0.8 + layerIndex * 0.7;
    const speedY = 8 + layerIndex * 10;
    const speedX = (layerIndex % 2 === 0 ? 1 : -1) * speedY * 0.12;
    const stars: Star[] = [];

    for (let starIndex = 0; starIndex < starCount; starIndex += 1) {
      stars.push({
        x: random() * width,
        y: random() * height,
        size: baseSize + random() * 0.35
      });
    }

    layers.push({
      alpha: 0.35 + layerIndex * 0.15,
      drawMode: layerIndex === 0 ? "rect" : "arc",
      speedX,
      speedY,
      stars
    });
  }

  return layers;
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function normalizeLayerCount(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return MIN_LAYER_COUNT;
  }

  return Math.max(MIN_LAYER_COUNT, Math.floor(value));
}

function wrapCoordinate(value: number, size: number): number {
  return ((value % size) + size) % size;
}
