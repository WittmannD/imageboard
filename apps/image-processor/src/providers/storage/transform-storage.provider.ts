import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LocalStorageDriver } from '@hdotu1/media-storage/drivers';

export const TRANSFORM_STORAGE = 'TRANSFORM_STORAGE';

export const TransformStorageProvider: Provider = {
  provide: TRANSFORM_STORAGE,
  useFactory: (configService: ConfigService) =>
    new LocalStorageDriver(configService.get('TRANSFORM_STORAGE_PATH', '/')),
  inject: [ConfigService],
};
