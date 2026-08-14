import type { Provider } from '@nestjs/common';

import {
  aspectPenalty,
  balancePenalty,
  cropPenalty,
  featuredLandscapeTileLayoutTemplate,
  featuredPortraitTileLayoutTemplate,
  galleryAspectPenalty,
  landscapeTilesLayoutTemplate,
  LayoutEngine,
  portraitTilesLayoutTemplate,
  sizePenalty,
} from '@hdotu1/gallery-layout-engine';

export const GalleryLayoutEngineProvider = {
  provide: LayoutEngine,
  useFactory: () => {
    const layoutEngine = new LayoutEngine({
      CONTAINER_WIDTH: 544,
      MIN_ASPECT: 0.5,
      MAX_ASPECT: 2.5,
      GAP: 6,
      IDEAL_GALLERY_ASPECT: 1.3,
      IDEAL_MIN_ASPECT: 0.7,
      IDEAL_MAX_ASPECT: 2.5,
      IDEAL_MIN_SIZE: 120,
    });

    layoutEngine
      .registerTemplate(portraitTilesLayoutTemplate)
      .registerTemplate(landscapeTilesLayoutTemplate)
      .registerTemplate(featuredPortraitTileLayoutTemplate)
      .registerTemplate(featuredLandscapeTileLayoutTemplate);

    layoutEngine
      .registerPenalty(cropPenalty(), 100)
      .registerPenalty(galleryAspectPenalty(), 50)
      .registerPenalty(balancePenalty(), 20)
      .registerPenalty(sizePenalty(), 10)
      .registerPenalty(aspectPenalty(), 10);

    layoutEngine.setFallbackTemplate(landscapeTilesLayoutTemplate);

    return layoutEngine;
  },
} satisfies Provider;
