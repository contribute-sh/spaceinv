export interface ScoreStore {
  getValue(): number;
  add(points: number): void;
  reset(): void;
}

export function createScore(): ScoreStore {
  let value = 0;

  return {
    getValue(): number {
      return value;
    },
    add(points: number): void {
      if (points < 0) {
        throw new RangeError("Score increments cannot be negative");
      }

      value += points;
    },
    reset(): void {
      value = 0;
    },
  };
}
