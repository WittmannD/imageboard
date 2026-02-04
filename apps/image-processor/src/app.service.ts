import { Inject, Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import sharp, { type Sharp } from 'sharp';

import {
  IMAGE_PROCESSOR_CONFIG,
  type ImageProcessorConfig,
} from './config/image-processor-config.js';
import { MEDIA_SOURCE, type MediaSource } from './media-source/media-source.js';
import {
  MEDIA_STORAGE,
  type MediaStorage,
} from './media-storage/media-storage.js';
import {
  type ImageTransformOptions,
  OperationMapper,
  TransformOperation,
} from './transform/operations.js';

@Injectable()
export class AppService {
  constructor(
    @Inject(MEDIA_SOURCE) private mediaSource: MediaSource,
    @Inject(MEDIA_STORAGE) private mediaStorage: MediaStorage,
    private configService: ConfigService,
  ) {}

  private createTransformPipeline(operations: ImageTransformOptions[]): Sharp {
    const operationMapper = new OperationMapper();
    const pipeline = sharp();

    for (const options of operations) {
      const operation: TransformOperation = operationMapper.get(
        options.operation,
      );

      operation.process(pipeline, options.args);
    }

    return pipeline;
  }

  public process(imageKey: string, operations: ImageTransformOptions[]): void {
    const imageStream = this.mediaSource.get(imageKey);
    const transformPipeline = this.createTransformPipeline(operations);
    const writable = this.mediaStorage.writableStream('');

    imageStream.pipe(transformPipeline).pipe(writable);
  }

  public processFromConfig(imageKey: string): void {
    const config = this.configService.get<ImageProcessorConfig>(
      IMAGE_PROCESSOR_CONFIG,
    );

    if (!config?.transform) {
      return;
    }

    this.process(imageKey, config.transform);
  }
}
