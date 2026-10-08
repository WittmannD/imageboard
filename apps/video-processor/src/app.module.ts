import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import configuration from './config/configuration.js';
import { FfmpegProvider } from './ffmpeg/ffmpeg.provider.js';
import { SourceStorageProvider } from './providers/storage/source-storage.provider.js';
import { TransformStorageProvider } from './providers/storage/transform-storage.provider.js';
import { JobQueueProvider } from './queue/job-queue.provider.js';
import { TransformConfigService } from './transform/transform-config.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [configuration],
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    SourceStorageProvider,
    TransformStorageProvider,
    TransformConfigService,
    FfmpegProvider,
    JobQueueProvider,
    AppService,
  ],
})
export class AppModule {}
