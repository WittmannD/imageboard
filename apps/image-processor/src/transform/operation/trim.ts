import type { Sharp, TrimOptions } from 'sharp';

import type { Operation } from './operation.js';

export type ImageTrimOperationArgs = TrimOptions;

export const TrimOperation: Operation<'trim'> = {
  process(pipeline: Sharp, args: ImageTrimOperationArgs): Sharp {
    return pipeline.trim(args);
  }
}
