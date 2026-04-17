export type Vector2 = Readonly<{
  x: number;
  y: number;
}>;

export function vec(x: number, y: number): Vector2 {
  return { x, y };
}

export function zero(): Vector2 {
  return { x: 0, y: 0 };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

export function sub(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

export function scale(vector: Vector2, scalar: number): Vector2 {
  if (scalar === 0) {
    return zero();
  }

  return {
    x: vector.x * scalar,
    y: vector.y * scalar
  };
}

export function lenSq(vector: Vector2): number {
  return vector.x * vector.x + vector.y * vector.y;
}

export function len(vector: Vector2): number {
  return Math.sqrt(lenSq(vector));
}

export function normalize(vector: Vector2): Vector2 {
  const lengthSquared = lenSq(vector);

  if (lengthSquared === 0) {
    return zero();
  }

  const inverseLength = 1 / Math.sqrt(lengthSquared);

  return {
    x: vector.x * inverseLength,
    y: vector.y * inverseLength
  };
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function clamp(vector: Vector2, min: Vector2, max: Vector2): Vector2 {
  return {
    x: clampAxis(vector.x, min.x, max.x),
    y: clampAxis(vector.y, min.y, max.y)
  };
}

function clampAxis(value: number, min: number, max: number): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  return Math.min(Math.max(value, lower), upper);
}
