export type Vector2 = {
  x: number;
  y: number;
};

export function add(a: Readonly<Vector2>, b: Readonly<Vector2>): Vector2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

export function sub(a: Readonly<Vector2>, b: Readonly<Vector2>): Vector2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

export function scale(vector: Readonly<Vector2>, scalar: number): Vector2 {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar
  };
}

export function clamp(
  vector: Readonly<Vector2>,
  min: Readonly<Vector2>,
  max: Readonly<Vector2>
): Vector2 {
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
