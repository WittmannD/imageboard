import { Module } from '@nestjs/common';
import {type ClientProxy, ClientProxyFactory, Transport} from "@nestjs/microservices";
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './client.module-definition.js';
import {IMAGE_PROCESSOR_CLIENT_TOKEN} from "./constants.js";
import type {ImageProcessorClientOptions} from "./client-options.interface.js";
import {ImageProcessorService} from "./client.service.js";

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: IMAGE_PROCESSOR_CLIENT_TOKEN,
      useFactory: (options: ImageProcessorClientOptions): ClientProxy => {
        return ClientProxyFactory.create({
          transport: Transport.REDIS,
          options: options.redis,
        });
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    ImageProcessorService
  ],
  exports: [IMAGE_PROCESSOR_CLIENT_TOKEN, MODULE_OPTIONS_TOKEN, ImageProcessorService],
})
export class ImageProcessorClientModule extends ConfigurableModuleClass {}
