import type { OutputInfo } from 'sharp';

export interface FileOutputInfo extends OutputInfo {
  filename: string;
  path: string;
}

export abstract class ImageTransformerEvent {}

export class OutputEvent extends ImageTransformerEvent {
  constructor(
    public readonly uuid: string,
    public readonly data: FileOutputInfo,
  ) {
    super();
  }
}

export class BeforeOutputEvent extends ImageTransformerEvent {
  constructor(public readonly uuid: string) {
    super();
  }
}

export class EndEvent extends ImageTransformerEvent {}
