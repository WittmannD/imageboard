import { randomUUID } from 'node:crypto';
import { parse, type ParsedPath } from 'node:path';
import type { Metadata } from 'sharp';

export type ImageOperationContextImageFile = ParsedPath;
export interface ImageOperationContextValues {
  metadata: Metadata;
  key: string;
}

export class ImageOperationContext {
  public readonly uuid: string;
  private constructor(
    public readonly file: ImageOperationContextImageFile,
    public readonly metadata: Metadata
  ) {
    this.uuid = randomUUID();
  }

  static create(values: ImageOperationContextValues) {
    return new ImageOperationContext(
      parse(values.key),
      values.metadata,
    );
  }
}
