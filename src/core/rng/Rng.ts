export class Rng {
  private state: number;

  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;

    let value = this.state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return (value ^ (value >>> 14)) >>> 0;
  }

  public nextFloat(): number {
    return this.next() / 0x1_0000_0000;
  }

  public nextInt(min: number, max: number): number {
    const lower = Math.ceil(Math.min(min, max));
    const upper = Math.floor(Math.max(min, max));

    if (lower === upper) {
      return lower;
    }

    return lower + Math.floor(this.nextFloat() * (upper - lower + 1));
  }

  public nextRange(min: number, max: number): number {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);

    return lower + this.nextFloat() * (upper - lower);
  }
}
