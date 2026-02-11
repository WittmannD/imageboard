import type { PngOptions, Sharp } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImagePngOperationArgs = PngOptions;

export class PngOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImagePngOperationArgs): Sharp {
    return pipeline.png(args);
  }
}
