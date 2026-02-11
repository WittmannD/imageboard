import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import imageProcessorConfig, {
  IMAGE_PROCESSOR_CONFIG,
} from './config/image-processor-config.js';
import {
  FsMediaSource,
  type FsMediaSourceOptions,
} from './media-source/fs-media-source.js';
import { MEDIA_SOURCE } from './media-source/media-source.js';
import { FsMediaStorage } from './media-storage/fs-media-storage.js';
import { MEDIA_STORAGE } from './media-storage/media-storage.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [imageProcessorConfig],
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      inject: [ConfigService],
      provide: MEDIA_SOURCE,
      useFactory: (configService: ConfigService) =>
        new FsMediaSource(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          configService.get<FsMediaSourceOptions>(
            `${IMAGE_PROCESSOR_CONFIG}.media-source`,
          )!,
        ),
    },
    {
      provide: MEDIA_STORAGE,
      useClass: FsMediaStorage,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    AppService,
  ],
})
export class AppModule {}
