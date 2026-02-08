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

  private applyOperations(
    transformPipeline: sharp.Sharp,
    operations: NestedTransformOperations,
  ) {
    for (const transformOptionsOrArray of operations) {
      if (
        Array.isArray(transformOptionsOrArray) &&
        transformOptionsOrArray.length
      ) {
        const forkPipeline = transformPipeline.clone();
        this.applyOperations(forkPipeline, transformOptionsOrArray);
        continue;
      }

      const transformOptions = transformOptionsOrArray as ImageTransformOptions;
      const operation: TransformOperation = this.operationMapper.getInstance(
        transformOptions.operation,
        this.eventEmitter,
      );

      console.log('apply', transformOptions.operation, operation.uuid);

      operation.process(transformPipeline, transformOptions.args);
    }
  }

  transform(imageStream: Readable) {
    const sharpPipeline = sharp();
    this.applyOperations(sharpPipeline, this.operations);

    this.eventEmitter.on('output', (output) => {
      console.log(output);
    });

    this.eventEmitter.on('end', () => {
      console.log('end');
    });

    void pipeline(imageStream, sharpPipeline)
      .then(() => this.waitForWriteTasks())
      .then(() => {
        this.eventEmitter.emit('end', new EndEvent());
      });
  }
}
