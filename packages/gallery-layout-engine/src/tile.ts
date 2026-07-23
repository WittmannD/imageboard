export interface TileParams {
  key: string;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  fit?: 'contain' | 'cover';
  column: number;
  columnSpan?: number;
  row: number;
  rowSpan?: number;
}

export class Tile {
  public readonly key: string;
  public readonly width: number;
  public readonly height: number;
  public readonly originalWidth: number;
  public readonly originalHeight: number;
  public readonly fit: 'contain' | 'cover';
  public readonly column: number;
  public readonly columnSpan: number;
  public readonly row: number;
  public readonly rowSpan: number;

  constructor(params: TileParams) {
    this.key = params.key;
    this.width = params.width;
    this.height = params.height;
    this.originalWidth = params.originalWidth ?? params.width;
    this.originalHeight = params.originalHeight ?? params.height;
    this.fit = params.fit ?? 'cover';
    this.column = params.column;
    this.columnSpan = params.columnSpan ?? 1;
    this.row = params.row;
    this.rowSpan = params.rowSpan ?? 1;
  }

  static from(params: TileParams): Tile {
    return new Tile(params);
  }

  getAspectRatio() {
    return this.width / this.height;
  }

  getOriginalAspectRatio() {
    return this.originalWidth / this.originalHeight;
  }

  getVisibleFraction() {
    const original = this.getOriginalAspectRatio();
    const tile = this.getAspectRatio();

    if (original > tile) {
      return tile / original;
    }

    return original / tile;
  }
}
