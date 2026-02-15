import { randomUUID } from 'node:crypto';
import { parse, type ParsedPath } from 'node:path';
import type { Metadata } from 'sharp';

import type { ImageProcessorConfig } from '../config/image-processor-config.js';

export type ImageOperationContextImageFile = ParsedPath;
export interface ImageOperationContextValues {
  metadata: Metadata;
  config: ImageProcessorConfig;
  file: string;
}

export class ImageOperationContext {
  public readonly uuid: string;
  private constructor(
    public readonly file: ImageOperationContextImageFile,
    public readonly metadata: Metadata,
    public readonly config: ImageProcessorConfig,
  ) {
    this.uuid = randomUUID();
  }

  static create(values: ImageOperationContextValues) {
    return new ImageOperationContext(
      parse(values.file),
      values.metadata,
      values.config,
    );
  }
}
