import type { Region, Sharp } from 'sharp';

import type { Operation } from './operation.js';

export type ImageExtractOperationArgs = Region;

export const ExtractOperation: Operation<'extract'> = {
  process(pipeline: Sharp, args: ImageExtractOperationArgs): Sharp {
    return pipeline.extract(args);
  }
}
