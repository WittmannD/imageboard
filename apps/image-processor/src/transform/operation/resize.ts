import type { ResizeOptions, Sharp } from 'sharp';

import type { Operation } from './operation.js';

export type ImageResizeOperationArgs = ResizeOptions;

export const ResizeOperation: Operation<'resize'> = {
  process(pipeline: Sharp, args: ImageResizeOperationArgs): Sharp {
    return pipeline.resize(args);
  }
}
