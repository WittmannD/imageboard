import type { JpegOptions, Sharp } from 'sharp';

import { TransformOperation } from './operation.js';

export type ImageJpegOperationArgs = JpegOptions;

export class JpegOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageJpegOperationArgs): Sharp {
    return pipeline.jpeg(args);
  }
}
