import type { JpegOptions, Sharp } from 'sharp';

import type { Operation } from './operation.js';

export type ImageJpegOperationArgs = JpegOptions;

export const JpegOperation: Operation<'jpeg'> = {
  process(pipeline: Sharp, args: ImageJpegOperationArgs): Sharp {
    return pipeline.jpeg(args);
  }
}
