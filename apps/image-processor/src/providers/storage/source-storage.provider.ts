import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LocalStorageDriver } from '@hdotu1/media-storage/drivers';

export const SOURCE_STORAGE = 'SOURCE_STORAGE';

export const SourceStorageProvider: Provider = {
  provide: SOURCE_STORAGE,
  useFactory: (configService: ConfigService) =>
    new LocalStorageDriver(configService.get('SHARED_PATH', '/tmp')),
  inject: [ConfigService]
};
