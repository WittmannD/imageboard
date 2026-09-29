import type { Tile } from './tile.js';

export
class Layout {
  constructor(public readonly tiles: Tile[] = []) {}

  static from(tiles: Tile[]): Layout {
    return new Layout(tiles);
  }

  add(tile: Tile): this {
    this.tiles.push(tile);
    return this;
  }

  getRow(n: number): Tile[] {
    return this.tiles.filter((tile) => tile.row === n);
  }

  getColumn(n: number): Tile[] {
    return this.tiles.filter((tile) => tile.column === n);
  }

  getColumnWidth(n: number): number {
    const tiles = this.getColumn(n);

    if (!tiles.length) {
      return 0;
    }

    // Prefer a tile that occupies exactly this column
    const tile = tiles.find((t) => t.columnSpan === 1) ?? tiles[0];

    return tile.width / tile.columnSpan;
  }

  getRowHeight(n: number): number {
    const tiles = this.getRow(n);

    if (!tiles.length) {
      return 0;
    }

    // Prefer a tile that occupies exactly this row
    const tile = tiles.find((t) => t.rowSpan === 1) ?? tiles[0];

    return tile.height / tile.rowSpan;
  }

  getRows(): Tile[][] {
    const rows: Tile[][] = [];

    for (const tile of this.tiles) {
      rows[tile.row] ??= [];
      rows[tile.row].push(tile);
    }

    return rows;
  }

  getColumns(): Tile[][] {
    const columns: Tile[][] = [];

    for (const tile of this.tiles) {
      columns[tile.column] ??= [];
      columns[tile.column].push(tile);
    }

    return columns;
  }

  getTotalHeight(gap = 0) {
    let i = 1;
    let rowHeight = 0;
    let result = 0;
    while ((rowHeight = this.getRowHeight(i)) !== 0) {
      i++;
      result += rowHeight;
    }

    // Gaps between the i - 1 rows
    return result + Math.max(0, i - 2) * gap;
  }
}
