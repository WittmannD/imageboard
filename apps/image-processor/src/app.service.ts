import type { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  defer,
  first,
  from,
  fromEvent,
  map,
  Observable,
  switchMap,
  takeUntil,
  toArray,
} from 'rxjs';

import {
  IMAGE_PROCESSOR_CONFIG,
  type ImageProcessorConfig,
} from './config/image-processor-config.js';
import {
  DEFAULT_IMAGE_TRANSFORM_CONFIG,
  IMAGE_TRANSFORM_CONFIG_LOADER,
  ImageTransformConfigLoader,
} from './config/image-transform-config.js';
import type { FsMediaSource } from './media-source/fs-media-source.js';
import { MEDIA_SOURCE } from './media-source/media-source.js';
import type { FsMediaStorage } from './media-storage/fs-media-storage.js';
import { MEDIA_STORAGE } from './media-storage/media-storage.js';
import { type FileOutputInfo, OutputEvent } from './transform/events.js';
import { ImageOperationContext } from './transform/image-operation-context.js';
import { ImageTransformer } from './transform/image-transformer.js';
import type { NestedTransformOperations } from './transform/operation/options.js';
import { peekMetadata } from './utils/stream.js';

@Injectable()
export class AppService {
  constructor(
    @Inject(IMAGE_TRANSFORM_CONFIG_LOADER)
    private imageTransformConfigLoader: ImageTransformConfigLoader,
    @Inject(MEDIA_SOURCE) private mediaSource: FsMediaSource,
    @Inject(MEDIA_STORAGE) private mediaStorage: FsMediaStorage,
    private configService: ConfigService,
  ) {}

  private transform(
    source: Readable,
    operations: NestedTransformOperations,
  ): Observable<FileOutputInfo[]> {
    const imageTransformer = new ImageTransformer(operations, (key: string) =>
      this.mediaStorage.writableStream(key),
    );

    imageTransformer.transform(source);
    const end$ = fromEvent(imageTransformer, 'end').pipe(first());
    return fromEvent(imageTransformer, 'output').pipe(
      takeUntil(end$),
      toArray(),
      map((events) => {
        const outputEvents = events as OutputEvent[];
        return outputEvents.map((event) => event.data);
      }),
    );
  }

  public process(
    imageKey: string,
    operations: NestedTransformOperations,
  ): Observable<FileOutputInfo[]> {
    const imageStream = this.mediaSource.get(imageKey);
    return this.transform(imageStream, operations);
  }

  public processFromConfig(
    imageKey: string,
    configKey?: string,
  ): Observable<FileOutputInfo[]> {
    configKey = configKey ?? DEFAULT_IMAGE_TRANSFORM_CONFIG;
    const imageStream = this.mediaSource.get(imageKey);

    const config = this.configService.get<ImageProcessorConfig>(
      IMAGE_PROCESSOR_CONFIG,
    );

    if (!config) {
      throw new Error('Image processor config is missing');
    }

    return from(peekMetadata(imageStream)).pipe(
      switchMap((metadata) =>
        defer(async () => {
          const transformConfig =
            await this.imageTransformConfigLoader.get(configKey);
          const context = ImageOperationContext.create({
            metadata,
            config,
            file: imageKey,
          });

          return transformConfig.resolve(context);
        }),
      ),
      switchMap((config) => this.transform(imageStream, config.transform)),
    );
  }
}
