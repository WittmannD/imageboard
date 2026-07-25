import type { OutputInfo } from 'sharp';

export interface FileOutputInfo extends OutputInfo {
  filename: string;
  key: string;
  metadata?: Record<string, unknown>;
}

export abstract class ImageTransformerEvent {}

export class OutputEvent extends ImageTransformerEvent {
  constructor(
    public readonly operationUuid: string,
    public readonly data: FileOutputInfo,
  ) {
    super();
  }
}

export class BeforeOutputEvent extends ImageTransformerEvent {
  constructor(public readonly operationUuid: string) {
    super();
  }
}

export class EndEvent extends ImageTransformerEvent {}

export class ErrorEvent extends ImageTransformerEvent {
  constructor(
    public readonly operationUuid: string,
    public readonly error: Error,
  ) {
    super();
  }
}
