import { Module } from '@nestjs/common';
import { type ClientProxy, ClientProxyFactory } from '@nestjs/microservices';

import { RedisTransportClient } from '@hdotu1/redis-transport';

import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './client.module-definition.js';
import { ImageProcessorService } from './client.service.js';
import type { ImageProcessorClientOptions } from './client-options.interface.js';
import { IMAGE_PROCESSOR_CLIENT_TOKEN } from './constants.js';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: IMAGE_PROCESSOR_CLIENT_TOKEN,
      useFactory: (options: ImageProcessorClientOptions): ClientProxy => {
        return ClientProxyFactory.create({
          customClass: RedisTransportClient,
          options: options.redis,
        });
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    ImageProcessorService,
  ],
  exports: [
    IMAGE_PROCESSOR_CLIENT_TOKEN,
    MODULE_OPTIONS_TOKEN,
    ImageProcessorService,
  ],
})
export class ImageProcessorClientModule extends ConfigurableModuleClass {}
