import type { Region, Sharp } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageExtractOperationArgs = Region;

export class ExtractOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageExtractOperationArgs): Sharp {
    return pipeline.extract(args);
  }
}
