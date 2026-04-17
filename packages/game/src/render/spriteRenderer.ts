export interface SpriteFrame {
  h: number;
  w: number;
  x: number;
  y: number;
}

export type SpriteFrameLookup = number | string;

export type SpriteFrameKey = SpriteFrameLookup | readonly SpriteFrameLookup[];

export type SpriteFrameTable = Readonly<Record<string, SpriteFrame>>;

export interface SpriteDrawOptions {
  elapsedSeconds?: number;
  frameIndex?: number;
  framesPerSecond?: number;
  height?: number;
  width?: number;
}

interface FrameEntry { index: number; rect: SpriteFrame; }

interface QueuedDrawCall {
  ctx: CanvasRenderingContext2D;
  dx: number;
  dy: number;
  frame: FrameEntry;
  height: number;
  width: number;
}

export class SpriteRenderer {
  private batching = false;
  private readonly frameEntries: FrameEntry[];
  private readonly framesByName = new Map<string, FrameEntry>();
  private readonly queuedDraws: QueuedDrawCall[] = [];

  constructor(
    private readonly atlas: CanvasImageSource,
    frameTable: SpriteFrameTable,
  ) {
    this.frameEntries = Object.entries(frameTable).map(([name, frame], index) => {
      const entry: FrameEntry = { index, rect: normalizeFrame(frame, name) };
      this.framesByName.set(name, entry);
      return entry;
    });

    if (this.frameEntries.length === 0) {
      throw new Error("SpriteRenderer requires at least one atlas frame.");
    }
  }

  begin(): void {
    this.flush();
    this.batching = true;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    frameKey: SpriteFrameKey,
    dx: number,
    dy: number,
    options: SpriteDrawOptions = {},
  ): void {
    const frame = this.resolveFrame(frameKey, options);
    const drawCall: QueuedDrawCall = {
      ctx,
      dx,
      dy,
      frame,
      height: normalizeDrawSize(options.height, frame.rect.h),
      width: normalizeDrawSize(options.width, frame.rect.w),
    };

    if (this.batching) {
      this.queuedDraws.push(drawCall);
      return;
    }

    this.renderDrawCall(drawCall);
  }

  end(): void {
    this.flush();
    this.batching = false;
  }

  flush(): void {
    if (this.queuedDraws.length === 0) {
      return;
    }

    for (const group of groupDrawCalls(this.queuedDraws)) {
      for (const drawCall of group) {
        this.renderDrawCall(drawCall);
      }
    }

    this.queuedDraws.length = 0;
  }

  private renderDrawCall(drawCall: QueuedDrawCall): void {
    const { ctx, dx, dy, frame, height, width } = drawCall;

    ctx.drawImage(
      this.atlas,
      frame.rect.x,
      frame.rect.y,
      frame.rect.w,
      frame.rect.h,
      dx,
      dy,
      width,
      height,
    );
  }

  private resolveFrame(
    frameKey: SpriteFrameKey,
    options: SpriteDrawOptions,
  ): FrameEntry {
    if (Array.isArray(frameKey)) {
      return this.resolveAnimationFrame(frameKey, options);
    }

    return this.resolveFrameLookup(frameKey);
  }

  private resolveAnimationFrame(
    frameKeys: readonly SpriteFrameLookup[],
    options: SpriteDrawOptions,
  ): FrameEntry {
    if (frameKeys.length === 0) {
      throw new Error(
        "Sprite animation sequences must include at least one frame.",
      );
    }

    const frameIndex = resolveAnimationFrameIndex(frameKeys.length, options);

    return this.resolveFrameLookup(frameKeys[frameIndex]);
  }

  private resolveFrameLookup(frameKey: SpriteFrameLookup): FrameEntry {
    if (typeof frameKey === "number") {
      return this.resolveFrameByIndex(frameKey);
    }

    const frame = this.framesByName.get(frameKey);

    if (!frame) {
      throw new Error(`Unknown sprite frame "${frameKey}".`);
    }

    return frame;
  }

  private resolveFrameByIndex(frameKey: number): FrameEntry {
    if (!Number.isFinite(frameKey)) {
      throw new Error(`Sprite frame index must be finite. Received ${frameKey}.`);
    }

    const normalizedIndex = Math.floor(frameKey);
    const frame = this.frameEntries[normalizedIndex];

    if (!frame) {
      throw new Error(`Unknown sprite frame index ${frameKey}.`);
    }

    return frame;
  }
}

function groupDrawCalls(drawCalls: readonly QueuedDrawCall[]): QueuedDrawCall[][] {
  const groups: QueuedDrawCall[][] = [];
  const groupsByContext = new Map<CanvasRenderingContext2D, Map<number, number>>();

  for (const drawCall of drawCalls) {
    let contextGroups = groupsByContext.get(drawCall.ctx);

    if (!contextGroups) {
      contextGroups = new Map<number, number>();
      groupsByContext.set(drawCall.ctx, contextGroups);
    }

    let groupIndex = contextGroups.get(drawCall.frame.index);

    if (groupIndex === undefined) {
      groupIndex = groups.length;
      contextGroups.set(drawCall.frame.index, groupIndex);
      groups.push([]);
    }

    groups[groupIndex]?.push(drawCall);
  }

  return groups;
}

function normalizeDrawSize(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeFiniteNumber(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Sprite frame "${label}" must be finite.`);
  }

  return value;
}

function normalizePositiveNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Sprite frame "${label}" must be greater than zero.`);
  }

  return value;
}

function normalizeFrame(frame: SpriteFrame, label: string): SpriteFrame {
  return {
    h: normalizePositiveNumber(frame.h, `${label}.h`),
    w: normalizePositiveNumber(frame.w, `${label}.w`),
    x: normalizeFiniteNumber(frame.x, `${label}.x`),
    y: normalizeFiniteNumber(frame.y, `${label}.y`),
  };
}

function resolveAnimationFrameIndex(
  frameCount: number,
  options: SpriteDrawOptions,
): number {
  if (typeof options.frameIndex === "number" && Number.isFinite(options.frameIndex)) {
    return normalizeWrappedIndex(options.frameIndex, frameCount);
  }

  if (
    typeof options.framesPerSecond === "number" &&
    Number.isFinite(options.framesPerSecond) &&
    options.framesPerSecond > 0 &&
    typeof options.elapsedSeconds === "number" &&
    Number.isFinite(options.elapsedSeconds)
  ) {
    const elapsedSeconds = Math.max(0, options.elapsedSeconds);
    return normalizeWrappedIndex(
      Math.floor(elapsedSeconds * options.framesPerSecond),
      frameCount,
    );
  }

  return 0;
}

function normalizeWrappedIndex(value: number, count: number): number {
  const index = Math.floor(value);

  return ((index % count) + count) % count;
}
