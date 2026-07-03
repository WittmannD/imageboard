import type { AvifOptions, Sharp } from 'sharp';

import type { Operation } from './operation.js';

export type ImageAvifOperationArgs = AvifOptions;

export const AvifOperation: Operation<'avif'> = {
  process(pipeline: Sharp, args: ImageAvifOperationArgs): Sharp {
    return pipeline.avif(args);
  }
}
