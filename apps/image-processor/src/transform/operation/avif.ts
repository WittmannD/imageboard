import type { AvifOptions,Sharp } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageAvifOperationArgs = AvifOptions;

export class AvifOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageAvifOperationArgs): Sharp {
    return pipeline.avif(args);
  }
}
