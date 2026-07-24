import { randomUUID } from 'node:crypto';
import { parse, type ParsedPath } from 'node:path';
import type { Metadata } from 'sharp';

export type ParsedKey = ParsedPath;
export interface ImageOperationContextParams {
  metadata: Metadata;
  variables?: Record<string, unknown>;
  key: string;
}

export class TransformConfigContext {
  public readonly uuid: string;
  private constructor(
    public readonly file: ParsedKey,
    public readonly metadata: Metadata,
    public readonly variables: Record<string, unknown>
  ) {
    this.uuid = randomUUID();
  }

  static from(params: ImageOperationContextParams) {
    return new TransformConfigContext(
      parse(params.key),
      params.metadata,
      params.variables ?? {}
    );
  }
}
