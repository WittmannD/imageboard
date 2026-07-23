import type { LayoutContext } from './context.js';
import type { Layout } from './layout.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TemplatePenaltyFactory = (...args: any[]) => TemplatePenaltyFn;
export type TemplatePenaltyFn = (
  layout: Layout,
  context: LayoutContext,
) => number;
export interface TemplatePenalty {
  fn: TemplatePenaltyFn;
  weight: number;
}

// penalize excessive cropping
export const cropPenalty: TemplatePenaltyFactory = () => (layout) => {
  return (
    -layout.tiles
      .map((tile) =>
        Math.abs(
          Math.log(
            tile.originalWidth /
              tile.originalHeight /
              (tile.width / tile.height),
          ),
        ),
      )
      .reduce((a, b) => a + b) / layout.tiles.length
  );
};

// penalty for too small thumbnails
export const sizePenalty: TemplatePenaltyFactory = (
  options: {
    idealMinSize?: number;
  } = {},
) => {
  return (layout, context) => {
    const { idealMinSize = context.IDEAL_MIN_SIZE } = options;
    return (
      layout.tiles.reduce((score, tile) => {
        if (tile.width < idealMinSize) score += tile.width - idealMinSize;

        if (tile.height < idealMinSize) score += tile.height - idealMinSize;

        return score;
      }, 0) / layout.tiles.length
    );
  };
};

// Penalize layout where one tile occupies much more space than others
export const balancePenalty: TemplatePenaltyFactory = () => (layout) => {
  const areas = layout.tiles.map((t) => t.width * t.height);
  const mean = areas.reduce((a, b) => a + b, 0) / areas.length;
  const variance =
    areas.reduce((s, a) => s + (a - mean) ** 2, 0) / areas.length;
  const cv = Math.sqrt(variance) / mean;

  return -cv;
};

// Penalize extremely disbalanced aspect ratios
export const aspectPenalty: TemplatePenaltyFactory =
  (options: { idealMinAspect?: number; idealMaxAspect?: number } = {}) =>
  (layout, context) => {
    {
      const {
        idealMinAspect = context.IDEAL_MIN_ASPECT,
        idealMaxAspect = context.IDEAL_MAX_ASPECT,
      } = options;
      return (
        layout.tiles.reduce((score, tile) => {
          const r = tile.width / tile.height;

          if (r < idealMinAspect) return score + (r - idealMinAspect) * 100;

          if (r > idealMaxAspect) return score + (idealMaxAspect - r) * 100;

          return score;
        }, 0) / layout.tiles.length
      );
    }
  };

// Penalize for poor overall gallery aspect ratio
export const galleryAspectPenalty: TemplatePenaltyFactory =
  (options: { idealAspect?: number } = {}) =>
  (layout, context) => {
    const { idealAspect = context.IDEAL_GALLERY_ASPECT } = options;

    const width = context.CONTAINER_WIDTH;
    const height = layout.getTotalHeight();

    const r = width / height;

    return -Math.abs(Math.log(r / idealAspect));
  };
