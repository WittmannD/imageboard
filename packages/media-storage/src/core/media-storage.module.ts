import { Module } from '@nestjs/common';

import { MODULE_OPTIONS_TOKEN } from '@hdotu1/image-processor-client/src/client.module-definition.js';

import { STORAGE_DRIVER } from '../common/constants.js';
import type { StorageDriver } from '../drivers/index.js';
import { ConfigurableModuleClass } from './media-storage.module-definition.js';

@Module({
  imports: [],
  providers: [
    {
      provide: STORAGE_DRIVER,
      useFactory: (driver: StorageDriver) => {
        return driver;
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
  ],
  exports: [STORAGE_DRIVER],
})
export class MediaStorageModule extends ConfigurableModuleClass {}
