import { Module } from '@nestjs/common';
import { type ClientProxy, ClientProxyFactory } from '@nestjs/microservices';

import { RedisTransportClient } from '@hdotu1/redis-transport';

import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './client.module-definition.js';
import { VideoProcessorService } from './client.service.js';
import type { VideoProcessorClientOptions } from './client-options.interface.js';
import { VIDEO_PROCESSOR_CLIENT_TOKEN } from './constants.js';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: VIDEO_PROCESSOR_CLIENT_TOKEN,
      useFactory: (options: VideoProcessorClientOptions): ClientProxy => {
        return ClientProxyFactory.create({
          customClass: RedisTransportClient,
          options: {
            ...options.redis,
            keyPrefix: 'vidproc:',
          },
        });
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    VideoProcessorService,
  ],
  exports: [
    VIDEO_PROCESSOR_CLIENT_TOKEN,
    MODULE_OPTIONS_TOKEN,
    VideoProcessorService,
  ],
})
export class VideoProcessorClientModule extends ConfigurableModuleClass {}
