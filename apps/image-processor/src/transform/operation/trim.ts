import type { Sharp, TrimOptions } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageTrimOperationArgs = TrimOptions;

export class TrimOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageTrimOperationArgs): Sharp {
    return pipeline.trim(args);
  }
}
