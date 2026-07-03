import * as crypto from 'node:crypto';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';

import type { StorageDriver } from '@hdotu1/media-storage/drivers';

import { devNull } from '../utils/stream.js';
import { ImageTransformerEventEmitter } from './event-emitter.js';
import { EndEvent } from './events.js';
import { createOperationContext } from './operation/operation-context.js';
import {
  type OperationArgsMap,
  type OperationConfig,
  operationMap,
  type OperationNestedConfig,
  type OperationNestedConfigs,
} from './operation/operation-map.js';

export class ImageTransformer extends ImageTransformerEventEmitter {
  private readonly writeTasks: Set<string> = new Set<string>();

  constructor(
    private readonly operationConfig: OperationNestedConfigs,
    private readonly storage: StorageDriver,
  ) {
    super();

    this.addWriteTaskListeners();
  }

  private addWriteTaskListeners() {
    this.on('before-output', (event) => {
      this.writeTasks.add(event.operationUuid);
    });

    this.on('output', (event) => {
      this.writeTasks.delete(event.operationUuid);
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

  private isOperationArray(
    operations: OperationNestedConfig,
  ): operations is readonly OperationNestedConfig[] {
    return Array.isArray(operations);
  }

  private async executeOperation<K extends keyof OperationArgsMap>(
    pipeline: sharp.Sharp,
    config: OperationConfig<K>,
  ) {
    const context = createOperationContext(
      crypto.randomUUID(),
      this.storage,
      this,
    );
    await operationMap[config.operation].process(
      pipeline,
      config.args,
      context,
    );
  }

  private async applyOperations(
    transformPipeline: sharp.Sharp,
    configs: OperationNestedConfigs,
  ) {
    for (const configOrArray of configs) {
      if (this.isOperationArray(configOrArray) && configOrArray.length) {
        const forkPipeline = transformPipeline.clone();
        await this.applyOperations(forkPipeline, configOrArray);
        continue;
      }

      const operationConfig = configOrArray as OperationConfig;
      await this.executeOperation(transformPipeline, operationConfig);
    }
  }

  transform(imageStream: Readable): this {
    const sharpPipeline = sharp();

    void this.applyOperations(sharpPipeline, this.operationConfig)
      // We pipe the image stream to devnull so that if there are no save operations, the stream does not hang
      .then(() => pipeline(imageStream, sharpPipeline, devNull()))
      .then(() => this.waitForWriteTasks())
      .then(() => {
        this.emit('end', new EndEvent());
      });

    return this;
  }
}
