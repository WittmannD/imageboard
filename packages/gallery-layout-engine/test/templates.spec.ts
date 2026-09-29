import { describe, expect, it } from 'vitest';

import { LayoutContext } from '../src/context.js';
import type { Layout } from '../src/layout.js';
import { LayoutEngine } from '../src/layout-engine.js';
import {
  aspectPenalty,
  balancePenalty,
  cropPenalty,
  galleryAspectPenalty,
  galleryHeightPenalty,
  sizePenalty,
} from '../src/penalty.js';
import { column, image, row, solveSlicingLayout } from '../src/slicing.js';
import {
  balancedPairLayoutTemplate,
  featuredLandscapeMosaicLayoutTemplate,
  featuredLandscapeTileEndLayoutTemplate,
  featuredPairLandscapeLayoutTemplate,
  featuredPairPortraitLayoutTemplate,
  featuredPortraitMosaicEndLayoutTemplate,
  featuredPortraitMosaicLayoutTemplate,
  featuredPortraitTileEndLayoutTemplate,
  type InputImage,
  landscapeTilesLayoutTemplate,
  portraitTilesLayoutTemplate,
  type Template,
} from '../src/templates.js';

const context = LayoutContext.from({
  CONTAINER_WIDTH: 544,
  MIN_ASPECT: 0.5,
  MAX_ASPECT: 2.5,
  GAP: 6,
  IDEAL_GALLERY_ASPECT: 1.3,
  IDEAL_MIN_ASPECT: 0.7,
  IDEAL_MAX_ASPECT: 2.5,
  IDEAL_MIN_SIZE: 120,
});

const slicingTemplates: Template[] = [
  featuredPortraitTileEndLayoutTemplate,
  featuredLandscapeTileEndLayoutTemplate,
  featuredPortraitMosaicLayoutTemplate,
  featuredPortraitMosaicEndLayoutTemplate,
  featuredLandscapeMosaicLayoutTemplate,
  featuredPairPortraitLayoutTemplate,
  featuredPairLandscapeLayoutTemplate,
];

const imageSets: Record<string, [number, number][]> = {
  mixed: [
    [1200, 1600],
    [1920, 1080],
    [1000, 1000],
    [800, 1200],
    [2400, 1000],
  ],
  portraits: [
    [900, 1600],
    [1000, 1500],
    [1080, 1350],
    [900, 1600],
    [1000, 1500],
  ],
  landscapes: [
    [1600, 900],
    [1500, 1000],
    [2000, 1000],
    [1600, 900],
    [1350, 1080],
  ],
};

const toImages = (sizes: [number, number][]): InputImage[] =>
  sizes.map(([width, height], i) => ({ key: `img${i}`, width, height }));

/**
 * Replays CSS grid auto track sizing: tracks are sized by tiles that do not
 * span, and every tile must exactly cover its tracks plus inner gaps
 */
function expectRenderableGrid(layout: Layout) {
  const axes = [
    ['column', 'columnSpan', 'width'],
    ['row', 'rowSpan', 'height'],
  ] as const;

  for (const [position, span, size] of axes) {
    const tracks = new Map<number, number>();
    for (const tile of layout.tiles) {
      if (tile[span] !== 1) continue;
      const existing = tracks.get(tile[position]);
      if (existing !== undefined) expect(tile[size]).toBe(existing);
      tracks.set(tile[position], tile[size]);
    }

    for (const tile of layout.tiles) {
      let covered = (tile[span] - 1) * context.GAP;
      for (let i = 0; i < tile[span]; i++) {
        const track = tracks.get(tile[position] + i);
        expect(track).toBeDefined();
        covered += track ?? 0;
      }
      expect(covered).toBe(tile[size]);
    }
  }

  const width =
    [...new Set(layout.tiles.map((t) => t.column))]
      .map((c) => layout.getColumnWidth(c))
      .reduce((a, b) => a + b) +
    (new Set(layout.tiles.map((t) => t.column)).size - 1) * context.GAP;
  expect(width).toBe(context.CONTAINER_WIDTH);
}

describe('slicing templates', () => {
  for (const template of slicingTemplates) {
    for (const [setName, sizes] of Object.entries(imageSets)) {
      for (let count = template.minImages; count <= 5; count++) {
        it(`${template.name} fits ${count.toString()} ${setName} images`, () => {
          const images = toImages(sizes.slice(0, count));
          const layout = template.solve(images, context);

          expect(layout).not.toBeNull();
          if (!layout) return;

          expect(layout.tiles).toHaveLength(count);
          expect(layout.tiles.map((t) => t.key)).toEqual(
            expect.arrayContaining(images.map((im) => im.key)),
          );
          expectRenderableGrid(layout);

          // Only rounding may distort the aspect ratio
          for (const tile of layout.tiles) {
            expect(tile.getVisibleFraction()).toBeGreaterThan(0.97);
          }
        });
      }
    }
  }
});

describe('landscape-tiles', () => {
  it('keeps each image aspect ratio', () => {
    const layout = landscapeTilesLayoutTemplate.solve(
      toImages([
        [1600, 900],
        [2000, 1000],
      ]),
      context,
    );

    expect(layout.tiles.map((t) => [t.width, t.height])).toEqual([
      [544, 306],
      [544, 272],
    ]);
  });
});

describe('LayoutContext', () => {
  it('clamps aspect ratios to the configured range', () => {
    expect(context.getEffectiveAspect(0.2)).toBe(0.5);
    expect(context.getEffectiveAspect(1.5)).toBe(1.5);
    expect(context.getEffectiveAspect(4)).toBe(2.5);
  });
});

describe('solveSlicingLayout', () => {
  it('rejects layouts whose tracks cannot be sized by a CSS grid', () => {
    // Two stacks with different row boundaries leave tracks without a
    // non-spanning tile to size them
    const layout = solveSlicingLayout(
      row(column(image(0), image(1)), column(image(2), image(3), image(4))),
      toImages(imageSets['mixed']),
      context,
    );

    expect(layout).toBeNull();
  });
});

describe('balanced-pair', () => {
  const balancedPair = balancedPairLayoutTemplate(0.75);

  it('balances a portrait and a landscape within the crop budget', () => {
    const layout = balancedPair.solve(
      toImages([
        [1080, 1920],
        [2520, 1080],
      ]),
      context,
    );

    expect(layout).not.toBeNull();
    if (!layout) return;

    // Without cropping the portrait tile would be only 105px wide
    expect(layout.tiles.map((t) => [t.width, t.height])).toEqual([
      [161, 215],
      [377, 215],
    ]);
    for (const tile of layout.tiles) {
      expect(tile.getVisibleFraction()).toBeGreaterThanOrEqual(0.749);
    }
  });

  it('equalizes widths when the budget allows it', () => {
    const layout = balancedPair.solve(
      toImages([
        [1000, 1000],
        [1200, 1000],
      ]),
      context,
    );

    expect(layout?.tiles.map((t) => t.width)).toEqual([269, 269]);
  });

  it('only applies to two images', () => {
    expect(
      balancedPair.solve(toImages(imageSets['mixed'].slice(0, 3)), context),
    ).toBeNull();
  });

  it('is preferred over uncropped layouts only for mismatched pairs', () => {
    const engine = new LayoutEngine(context)
      .registerTemplate(portraitTilesLayoutTemplate)
      .registerTemplate(landscapeTilesLayoutTemplate)
      .registerTemplate(balancedPairLayoutTemplate(0.85))
      .registerTemplate(balancedPairLayoutTemplate(0.75))
      .registerPenalty(cropPenalty(), 100)
      .registerPenalty(galleryAspectPenalty(), 50)
      .registerPenalty(galleryHeightPenalty(), 200)
      .registerPenalty(balancePenalty(), 20)
      .registerPenalty(sizePenalty(), 10)
      .registerPenalty(aspectPenalty(), 10);

    const evaluate = (sizes: [number, number][]) =>
      engine.evaluate(toImages(sizes)).template;

    expect(
      evaluate([
        [1200, 1600],
        [1920, 1080],
      ]),
    ).toBe('portrait-tiles');
    expect(
      evaluate([
        [1080, 1920],
        [2520, 1080],
      ]),
    ).toMatch(/^balanced-pair-/);
  });
});
