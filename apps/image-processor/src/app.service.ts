import * as fs from 'node:fs';
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

import type { StorageDriver } from '@hdotu1/media-storage/drivers';

import {
  DEFAULT_IMAGE_TRANSFORM_CONFIG,
  IMAGE_TRANSFORM_CONFIG_LOADER,
  ImageTransformConfigLoader,
} from './config/image-transform-config.js';
import { SOURCE_STORAGE } from './providers/storage/source-storage.provider.js';
import { type FileOutputInfo, OutputEvent } from './transform/events.js';
import { ImageOperationContext } from './transform/image-operation-context.js';
import { ImageTransformer } from './transform/image-transformer.js';
import type { NestedTransformOperations } from './transform/operation/options.js';
import { peekMetadata } from './utils/stream.js';
import * as path from "node:path";

@Injectable()
export class AppService {
  constructor(
    @Inject(IMAGE_TRANSFORM_CONFIG_LOADER)
    private imageTransformConfigLoader: ImageTransformConfigLoader,
    @Inject(SOURCE_STORAGE) private sourceStorage: StorageDriver,
    // @Inject(TRANSFORM_STORAGE) private outputStorage: StorageDriver,
    private configService: ConfigService,
  ) {}

  private transform(
    source: Readable,
    operations: NestedTransformOperations,
  ): Observable<FileOutputInfo[]> {
    const imageTransformer = new ImageTransformer(operations, (key) =>
      // todo: replace with storage upload method
      fs.createWriteStream(
        path.resolve(this.configService.getOrThrow<string>('TRANSFORM_STORAGE_PATH'), key),
      ),
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
    return from(this.sourceStorage.download(imageKey)).pipe(
      switchMap((imageStream) => this.transform(imageStream, operations)),
    );
  }

  public processFromConfig(
    imageKey: string,
    configKey?: string,
  ): Observable<FileOutputInfo[]> {
    configKey = configKey ?? DEFAULT_IMAGE_TRANSFORM_CONFIG;

    return from(this.sourceStorage.download(imageKey)).pipe(
      switchMap((imageStream) =>
        defer(async () => {
          const metadata = await peekMetadata(imageStream);
          const transformConfig =
            await this.imageTransformConfigLoader.get(configKey);
          const context = ImageOperationContext.create({
            metadata,
            key: imageKey,
          });

          return transformConfig.resolve(context);
        }).pipe(
          switchMap((config) => this.transform(imageStream, config.transform)),
        ),
      ),
    );
  }
}
