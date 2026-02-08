import type { ResizeOptions, Sharp } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageResizeOperationArgs = ResizeOptions;

export class ResizeOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageResizeOperationArgs): Sharp {
    return pipeline.resize(args);
  }
}
