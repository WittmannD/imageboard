import type { ExtendOptions, Sharp } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageExtendOperationArgs = ExtendOptions;

export class ExtendOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageExtendOperationArgs): Sharp {
    return pipeline.extend(args);
  }
}
