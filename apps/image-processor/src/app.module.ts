import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ImageTransformConfigLoaderProvider } from './config/image-transform-config.js';
import { SourceStorageProvider } from './providers/storage/source-storage.provider.js';
import { TransformStorageProvider } from './providers/storage/transform-storage.provider.js';

@Module({
  imports: [
    ConfigModule.forRoot({}),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    SourceStorageProvider,
    TransformStorageProvider,
    ImageTransformConfigLoaderProvider,
    AppService,
  ],
})
export class AppModule {}
