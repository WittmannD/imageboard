import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { first, fromEvent, map, Observable, takeUntil, toArray } from 'rxjs';

import {
  IMAGE_PROCESSOR_CONFIG,
  type ImageProcessorConfig,
} from './config/image-processor-config.js';
import { MEDIA_SOURCE, type MediaSource } from './media-source/media-source.js';
import { type FileOutputInfo, OutputEvent } from './transform/events.js';
import { ImageTransformer } from './transform/image-transformer.js';
import type { NestedTransformOperations } from './transform/operation/options.js';

@Injectable()
export class AppService {
  constructor(
    @Inject(MEDIA_SOURCE) private mediaSource: MediaSource,
    //@Inject(MEDIA_STORAGE) private mediaStorage: MediaStorage,
    private configService: ConfigService,
  ) {}

  public process(
    imageKey: string,
    operations: NestedTransformOperations,
  ): Observable<FileOutputInfo[]> {
    const imageStream = this.mediaSource.get(imageKey);
    const imageTransformer = new ImageTransformer(operations);

    imageTransformer.transform(imageStream);
    const end$ = fromEvent(imageTransformer.eventEmitter, 'end').pipe(first());
    return fromEvent(imageTransformer.eventEmitter, 'output').pipe(
      takeUntil(end$),
      toArray(),
      map((events) => {
        const outputEvents = events as OutputEvent[];
        return outputEvents.map((event) => event.data);
      }),
    );
  }

  public processFromConfig(imageKey: string): Observable<FileOutputInfo[]> {
    const config = this.configService.get<ImageProcessorConfig>(
      IMAGE_PROCESSOR_CONFIG,
    );

    if (!config?.transform) {
      throw new Error('Invalid config');
    }

    return this.process(imageKey, config.transform);
  }
}
