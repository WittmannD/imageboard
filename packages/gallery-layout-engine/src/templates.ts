import type { LayoutContext } from './context.js';
import { Layout } from './layout.js';
import { Tile } from './tile.js';

export interface InputImage {
  key: string;
  width: number;
  height: number;
}

export interface Template {
  name: string;
  minImages: number;

  solve(images: InputImage[], context: LayoutContext): Layout | null;
}


/**
 * ```
 * +-------------+------+
 * |             | img2 |
 * |    img1     +------+
 * |             | ...  |
 * |             +------+
 * |             | imgN |
 * +-------------+------+
 * ```
 */
export const featuredPortraitTileLayoutTemplate = {
  name: 'featured-portrait-tile',
  minImages: 3,
  solve(images, context): Layout | null {
    const [featured, ...rest] = images;

    // Total vertical gap space between stacked items on the right
    const totalVerticalGap = (rest.length - 1) * context.GAP;

    // Available width after accounting for the horizontal gap between column 0 and column 1
    const availableWidth = context.CONTAINER_WIDTH - context.GAP;

    // Sum of aspect ratios (height / width) of the right-hand images
    const r = rest.reduce(
      (acc, image) => acc + context.getEffectiveAspect(image.height / image.width),
      0,
    );

    const featuredAspectRatio = context.getEffectiveAspect(
      featured.height / featured.width,
    );

    const rightWidth =
      (availableWidth * featuredAspectRatio - totalVerticalGap) /
      (featuredAspectRatio + r);
    const featuredWidth = availableWidth - rightWidth;

    // Total height of the layout (excluding horizontal outer bounds)
    const totalHeight = featuredWidth * featuredAspectRatio;

    return Layout.from([
      Tile.from({
        key: featured.key,
        width: Math.round(featuredWidth),
        height: Math.round(totalHeight),
        originalWidth: featured.width,
        originalHeight: featured.height,
        column: 1,
        row: 1,
        rowSpan: rest.length,
      }),
      ...rest.map((image, i) => {
        // Individual height for each stacked image proportional to its aspect ratio
        const imageHeight =
          context.getEffectiveAspect(image.height / image.width) * rightWidth;

        return Tile.from({
          key: image.key,
          width: Math.round(rightWidth),
          height: Math.round(imageHeight),
          originalWidth: image.width,
          originalHeight: image.height,
          column: 2,
          row: i + 1,
        });
      }),
    ]);
  },
} satisfies Template;

/**
 * ```
 * +--------------------+
 * |                    |
 * |        img1        |
 * |                    |
 * +------+------+------+
 * | img2 | ...  | imgN |
 * +------+------+------+
 * ```
 */
export const featuredLandscapeTileLayoutTemplate = {
  name: 'featured-landscape-tile',
  minImages: 3,
  solve(images, context): Layout | null {
    const [featured, ...rest] = images;

    const featuredRatio = context.getEffectiveAspect(
      featured.width / featured.height,
    );

    // Height of the featured tile based on total width
    const featuredHeight = context.CONTAINER_WIDTH / featuredRatio;

    // Sum of aspect ratios of the bottom row tiles
    const r = rest.reduce(
      (acc, im) => acc + context.getEffectiveAspect(im.width / im.height),
      0,
    );

    // Available width after accounting for the horizontal gap between all columns
    const availableWidth =
      context.CONTAINER_WIDTH - context.GAP * Math.max(0, rest.length - 1);

    // Bottom row height
    const rowHeight = availableWidth / r;

    return Layout.from([
      Tile.from({
        key: featured.key,
        width: Math.round(context.CONTAINER_WIDTH),
        height: Math.round(featuredHeight),
        originalWidth: featured.width,
        originalHeight: featured.height,
        column: 1,
        columnSpan: rest.length,
        row: 1,
      }),
      ...rest.map((image, i) => {
        // Individual width for each stacked image
        const imageWidth =
          rowHeight * context.getEffectiveAspect(image.width / image.height);
        return Tile.from({
          key: image.key,
          width: Math.round(imageWidth),
          height: Math.round(rowHeight),
          originalWidth: image.width,
          originalHeight: image.height,
          column: i + 1,
          row: 2,
        });
      }),
    ]);
  },
} satisfies Template;

/**
 * ```
 * +------+------+------+
 * |      |      |      |
 * |      |      |      |
 * | img1 | ...  | imgN |
 * |      |      |      |
 * |      |      |      |
 * +------+------+------+
 * ```
 */
export const portraitTilesLayoutTemplate = {
  name: 'portrait-tiles',
  minImages: 2,
  solve(images, context): Layout {
    const availableWidth =
      context.CONTAINER_WIDTH - context.GAP * Math.max(0, images.length - 1);

    // Sum of aspect ratios of the images
    const r = images.reduce(
      (acc, im) => acc + context.getEffectiveAspect(im.width / im.height),
      0,
    );
    const commonHeight = availableWidth / r;

    return Layout.from(
      images.map((image, i) => {
        const width =
          commonHeight * context.getEffectiveAspect(image.width / image.height);
        return Tile.from({
          key: image.key,
          width: Math.round(width),
          height: Math.round(commonHeight),
          originalWidth: image.width,
          originalHeight: image.height,
          column: i + 1,
          row: 1,
          fit: 'contain',
        });
      }),
    );
  },
} satisfies Template;

/**
 * ```
 * +--------------------+
 * |        img1        |
 * +--------------------+
 * |        ...         |
 * +--------------------+
 * |        imgN        |
 * +--------------------+
 * ```
 */
export const landscapeTilesLayoutTemplate = {
  name: 'landscape-tiles',
  minImages: 2,
  solve(images, context): Layout {
    return Layout.from(
      images.map((image, i) => {
        // Each row spans the full width, so its height follows its own aspect ratio
        const height =
          context.CONTAINER_WIDTH /
          context.getEffectiveAspect(image.width / image.height);
        return Tile.from({
          key: image.key,
          width: Math.round(context.CONTAINER_WIDTH),
          height: Math.round(height),
          originalWidth: image.width,
          originalHeight: image.height,
          column: 1,
          row: i + 1,
          fit: 'cover',
        });
      }),
    );
  },
} satisfies Template;

/**
 * ```
 * +----------+----------------+
 * |          |                |
 * |   img1   |      img2      |
 * |          |                |
 * +----------+----------------+
 * ```
 *
 * A row of two images whose tiles are pulled towards a common aspect ratio,
 * so that a portrait next to a landscape does not collapse into a thin strip.
 * Each image is cropped by at most `1 - minVisibleFraction` of its area; the
 * cropped area is split between both images in log space.
 */
export const balancedPairLayoutTemplate = (minVisibleFraction: number) =>
  ({
    name: `balanced-pair-${Math.round(minVisibleFraction * 100).toString()}`,
    minImages: 2,
    solve(images, context): Layout | null {
      if (images.length !== 2) {
        return null;
      }

      const aspects = images.map((im) => im.width / im.height);

      // Equal tile widths are reached at the geometric mean of the aspects
      const target = Math.sqrt(aspects[0] * aspects[1]);

      // Move each tile towards the target, within its crop budget
      const tileAspects = aspects.map((aspect) =>
        context.getEffectiveAspect(
          Math.min(
            Math.max(target, aspect * minVisibleFraction),
            aspect / minVisibleFraction,
          ),
        ),
      );

      const availableWidth = context.CONTAINER_WIDTH - context.GAP;
      const height = availableWidth / (tileAspects[0] + tileAspects[1]);

      // Round the first width and derive the second, so the row fills the container exactly
      const firstWidth = Math.round(height * tileAspects[0]);
      const widths = [firstWidth, availableWidth - firstWidth];

      return Layout.from(
        images.map((image, i) =>
          Tile.from({
            key: image.key,
            width: widths[i],
            height: Math.round(height),
            originalWidth: image.width,
            originalHeight: image.height,
            column: i + 1,
            row: 1,
          }),
        ),
      );
    },
  }) satisfies Template;
