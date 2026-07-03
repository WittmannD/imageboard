import type { PngOptions, Sharp } from 'sharp';

import type { Operation } from './operation.js';

export type ImagePngOperationArgs = PngOptions;

export const PngOperation: Operation<'png'> = {
  process(pipeline: Sharp, args: ImagePngOperationArgs): Sharp {
    return pipeline.png(args);
  }
}
