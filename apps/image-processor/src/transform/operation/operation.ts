import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { Sharp } from 'sharp';

import type { OutputFactory } from '../image-transformer.js';
import type { ImageTransformOptions } from './options.js';

export abstract class TransformOperation {
  public readonly uuid;

  constructor(
    public readonly outputFactory: OutputFactory,
    public readonly eventEmitter = new EventEmitter(),
  ) {
    this.uuid = randomUUID();
  }

  abstract process(
    pipeline: Sharp,
    args: ImageTransformOptions['args'],
  ): Sharp | Promise<Sharp>;
}
