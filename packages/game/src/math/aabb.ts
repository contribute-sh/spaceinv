/**
 * Axis-aligned bounding box represented as `{ x, y, width, height }`.
 * Edge checks are inclusive, so touching borders count as containment/intersection.
 */
export type AABB = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type Vector2Like = {
  readonly x: number;
  readonly y: number;
};

export type SweptIntersection = {
  readonly time: number;
  readonly normal: Vector2Like;
};

type AxisSweep = {
  readonly entryTime: number;
  readonly exitTime: number;
};

function minX(box: Readonly<AABB>): number {
  return Math.min(box.x, box.x + box.width);
}

function maxX(box: Readonly<AABB>): number {
  return Math.max(box.x, box.x + box.width);
}

function minY(box: Readonly<AABB>): number {
  return Math.min(box.y, box.y + box.height);
}

function maxY(box: Readonly<AABB>): number {
  return Math.max(box.y, box.y + box.height);
}

function sweepAxis(
  minA: number,
  maxA: number,
  velocity: number,
  minB: number,
  maxB: number,
): AxisSweep | null {
  if (velocity === 0) {
    if (maxA < minB || maxB < minA) {
      return null;
    }

    return {
      entryTime: Number.NEGATIVE_INFINITY,
      exitTime: Number.POSITIVE_INFINITY,
    };
  }

  const entryDistance = velocity > 0 ? minB - maxA : maxB - minA;
  const exitDistance = velocity > 0 ? maxB - minA : minB - maxA;

  return {
    entryTime: entryDistance / velocity,
    exitTime: exitDistance / velocity,
  };
}

function collisionNormal(
  xEntryTime: number,
  yEntryTime: number,
  velocity: Readonly<Vector2Like>,
): Vector2Like {
  if (xEntryTime > yEntryTime) {
    return velocity.x > 0 ? { x: -1, y: 0 } : { x: 1, y: 0 };
  }

  if (yEntryTime > xEntryTime) {
    return velocity.y > 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
  }

  if (Math.abs(velocity.x) >= Math.abs(velocity.y)) {
    return velocity.x > 0 ? { x: -1, y: 0 } : { x: 1, y: 0 };
  }

  return velocity.y > 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
}

export function contains(
  box: Readonly<AABB>,
  point: Readonly<Vector2Like>,
): boolean {
  return (
    point.x >= minX(box) &&
    point.x <= maxX(box) &&
    point.y >= minY(box) &&
    point.y <= maxY(box)
  );
}

export function intersects(a: Readonly<AABB>, b: Readonly<AABB>): boolean {
  return (
    maxX(a) >= minX(b) &&
    maxX(b) >= minX(a) &&
    maxY(a) >= minY(b) &&
    maxY(b) >= minY(a)
  );
}

export function sweptIntersect(
  a: Readonly<AABB>,
  velocityA: Readonly<Vector2Like>,
  b: Readonly<AABB>,
  velocityB: Readonly<Vector2Like>,
): SweptIntersection | null {
  if (intersects(a, b)) {
    return {
      time: 0,
      normal: { x: 0, y: 0 },
    };
  }

  const relativeVelocity = {
    x: velocityA.x - velocityB.x,
    y: velocityA.y - velocityB.y,
  };

  const xSweep = sweepAxis(
    minX(a),
    maxX(a),
    relativeVelocity.x,
    minX(b),
    maxX(b),
  );

  if (xSweep === null) {
    return null;
  }

  const ySweep = sweepAxis(
    minY(a),
    maxY(a),
    relativeVelocity.y,
    minY(b),
    maxY(b),
  );

  if (ySweep === null) {
    return null;
  }

  const entryTime = Math.max(xSweep.entryTime, ySweep.entryTime);
  const exitTime = Math.min(xSweep.exitTime, ySweep.exitTime);

  if (entryTime > exitTime || exitTime < 0 || entryTime < 0 || entryTime > 1) {
    return null;
  }

  return {
    time: entryTime,
    normal: collisionNormal(
      xSweep.entryTime,
      ySweep.entryTime,
      relativeVelocity,
    ),
  };
}
