import { randomUUID } from 'node:crypto';
import { parse, type ParsedPath } from 'node:path';

import type { VideoMetadata } from '../ffmpeg/probe.js';

export type ParsedKey = ParsedPath;
export interface VideoOperationContextParams {
  metadata: VideoMetadata;
  variables?: Record<string, unknown>;
  key: string;
}

export class TransformConfigContext {
  public readonly uuid: string;
  private constructor(
    public readonly file: ParsedKey,
    public readonly metadata: VideoMetadata,
    public readonly variables: Record<string, unknown>,
  ) {
    this.uuid = randomUUID();
  }

  static from(params: VideoOperationContextParams) {
    return new TransformConfigContext(
      parse(params.key),
      params.metadata,
      params.variables ?? {},
    );
  }
}
