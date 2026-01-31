import { Module } from '@nestjs/common';
import {ClientsModule, Transport} from "@nestjs/microservices";
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './client.module-definition.js';
import {IMAGE_PROCESSOR_CLIENT_TOKEN} from "./constants.js";
import type {ImageProcessorClientOptions} from "./client-options.interface.js";
import {ImageProcessorService} from "./client.service.js";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: IMAGE_PROCESSOR_CLIENT_TOKEN,
        useFactory: (options: ImageProcessorClientOptions) => ({
          transport: Transport.REDIS,
          options: options.redis
        }),
        inject: [{ token: MODULE_OPTIONS_TOKEN }]
      },
    ]),
  ],
  controllers: [],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorClientModule extends ConfigurableModuleClass {}
