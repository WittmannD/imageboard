import type { Sharp, WebpOptions } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageWebpOperationArgs = WebpOptions;

export class WebpOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageWebpOperationArgs): Sharp {
    return pipeline.webp(args);
  }
}
