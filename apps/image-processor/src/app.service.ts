import type { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
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

import { SOURCE_STORAGE } from './providers/storage/source-storage.provider.js';
import { TRANSFORM_STORAGE } from './providers/storage/transform-storage.provider.js';
import { type FileOutputInfo, OutputEvent } from './transform/events.js';
import { ImageTransformer } from './transform/image-transformer.js';
import type { OperationNestedConfigs } from './transform/operation/operation-map.js';
import { TransformConfigContext } from './transform/transform-config-context.js';
import { peekMetadata } from './utils/stream.js';
import { TransformConfigService } from './transform/transform-config.service.js';

export const DEFAULT_IMAGE_TRANSFORM_CONFIG = 'image-transform.config.yaml';

@Injectable()
export class AppService {
  constructor(
    @Inject(SOURCE_STORAGE) private sourceStorage: StorageDriver,
    @Inject(TRANSFORM_STORAGE) private outputStorage: StorageDriver,
    private readonly transformConfigService: TransformConfigService,
  ) {}

  private transform(
    source: Readable,
    operations: OperationNestedConfigs,
  ): Observable<FileOutputInfo[]> {
    const imageTransformer = new ImageTransformer(
      operations,
      this.outputStorage,
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
    operations: OperationNestedConfigs,
  ): Observable<FileOutputInfo[]> {
    return from(this.sourceStorage.download(imageKey)).pipe(
      switchMap((imageStream) => this.transform(imageStream, operations)),
    );
  }

  public processFromConfig(
    imageKey: string,
    variables?: Record<string, unknown>,
    configKey?: string,
  ): Observable<FileOutputInfo[]> {
    configKey = configKey ?? DEFAULT_IMAGE_TRANSFORM_CONFIG;

    return from(this.sourceStorage.download(imageKey)).pipe(
      switchMap((imageStream) =>
        defer(async () => {
          const metadata = await peekMetadata(imageStream);
          const transformConfig =
            await this.transformConfigService.getOrThrow(configKey);
          const context = TransformConfigContext.from({
            metadata,
            variables,
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
