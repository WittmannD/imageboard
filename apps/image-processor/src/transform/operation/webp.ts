import type { Sharp, WebpOptions } from 'sharp';

import type { Operation } from './operation.js';

export type ImageWebpOperationArgs = WebpOptions;

export const WebpOperation: Operation<'webp'> = {
  process(pipeline: Sharp, args: ImageWebpOperationArgs): Sharp {
    return pipeline.webp(args);
  }
}
