import { EventEmitter } from 'node:events';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';

import { ImageTransformerEventEmitter } from './event-emitter.js';
import { EndEvent } from './events.js';
import type { TransformOperation } from './operation/operation.js';
import { OperationMapper } from './operation/operation-mapper.js';
import type {
  ImageTransformOptions,
  NestedTransformOperations,
} from './operation/options.js';

export class ImageTransformer extends EventEmitter {
  public readonly eventEmitter = new ImageTransformerEventEmitter();
  private readonly operationMapper = new OperationMapper();
  private readonly writeTasks: Set<string> = new Set<string>();

  constructor(public readonly operations: NestedTransformOperations) {
    super();

    this.addWriteTaskListeners();
  }

  private addWriteTaskListeners() {
    this.eventEmitter.on('before-output', (event) => {
      this.writeTasks.add(event.uuid);
    });

    this.eventEmitter.on('output', (event) => {
      this.writeTasks.delete(event.uuid);
    });
  }

  private waitForWriteTasks() {
    // method to wait until all images are written
    let intervalRef: NodeJS.Timeout;

    return new Promise<void>((resolve) => {
      intervalRef = setInterval(() => {
        if (this.writeTasks.size === 0) {
          clearInterval(intervalRef);
          resolve();
        }
      }, 500);
    });
  }

  private async applyOperations(
    transformPipeline: sharp.Sharp,
    operations: NestedTransformOperations,
  ) {
    for (const transformOptionsOrArray of operations) {
      if (
        Array.isArray(transformOptionsOrArray) &&
        transformOptionsOrArray.length
      ) {
        const forkPipeline = transformPipeline.clone();
        await this.applyOperations(forkPipeline, transformOptionsOrArray);
        continue;
      }

      const transformOptions = transformOptionsOrArray as ImageTransformOptions;
      const operation: TransformOperation = this.operationMapper.getInstance(
        transformOptions.operation,
        this.eventEmitter,
      );

      await operation.process(transformPipeline, transformOptions.args);
    }
  }

  transform(imageStream: Readable) {
    const sharpPipeline = sharp();

    void this.applyOperations(sharpPipeline, this.operations)
      .then(() => pipeline(imageStream, sharpPipeline))
      .then(() => this.waitForWriteTasks())
      .then(() => {
        this.eventEmitter.emit('end', new EndEvent());
      });
  }
}
