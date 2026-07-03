import type { ExtendOptions, Sharp } from 'sharp';

import type { Operation } from './operation.js';

export type ImageExtendOperationArgs = ExtendOptions;

export const ExtendOperation: Operation<'extend'> = {
  process(pipeline: Sharp, args: ImageExtendOperationArgs): Sharp {
    return pipeline.extend(args);
  }
}
