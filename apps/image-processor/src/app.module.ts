import {ConfigModule} from "@nestjs/config";
import {Module} from '@nestjs/common';

import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {MEDIA_SOURCE} from "./media-source/media-source.js";
import {FsMediaSource} from "./media-source/fs-media-source.js";
import {MEDIA_STORAGE} from "./media-storage/media-storage.js";
import {FsMediaStorage} from "./media-storage/fs-media-storage.js";
import imageProcessorConfig from './config/image-processor-config.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [imageProcessorConfig]
    })
  ],
  controllers: [AppController],
  providers: [
    {
      provide: MEDIA_SOURCE,
      useClass: FsMediaSource
    },
    {
      provide: MEDIA_STORAGE,
      useClass: FsMediaStorage
    },
    AppService
  ],
})
export class AppModule {}
