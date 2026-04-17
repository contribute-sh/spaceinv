export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Bunker {
  readonly x: number;
  readonly y: number;
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;

  private readonly grid: boolean[][];

  constructor(
    x: number,
    y: number,
    cols: number,
    rows: number,
    cellSize: number,
  ) {
    this.x = x;
    this.y = y;
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
    this.grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => true),
    );
  }

  get bbox(): AABB {
    return {
      x: this.x,
      y: this.y,
      width: this.cols * this.cellSize,
      height: this.rows * this.cellSize,
    };
  }

  damage(x: number, y: number, radius: number): void {
    const radiusSquared = radius * radius;

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (!this.grid[row][col]) {
          continue;
        }

        const cellCenterX = this.x + (col + 0.5) * this.cellSize;
        const cellCenterY = this.y + (row + 0.5) * this.cellSize;
        const dx = cellCenterX - x;
        const dy = cellCenterY - y;

        if (dx * dx + dy * dy <= radiusSquared) {
          this.grid[row][col] = false;
        }
      }
    }
  }

  isIntact(col: number, row: number): boolean {
    this.assertInBounds(col, row);

    return this.grid[row][col];
  }

  cellBBox(col: number, row: number): AABB {
    this.assertInBounds(col, row);

    return {
      x: this.x + col * this.cellSize,
      y: this.y + row * this.cellSize,
      width: this.cellSize,
      height: this.cellSize,
    };
  }

  private assertInBounds(col: number, row: number): void {
    if (!Number.isInteger(col) || !Number.isInteger(row)) {
      throw new RangeError(
        `Cell coordinates must be integers: (${col}, ${row})`,
      );
    }

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      throw new RangeError(`Cell coordinates out of bounds: (${col}, ${row})`);
    }
  }
}
