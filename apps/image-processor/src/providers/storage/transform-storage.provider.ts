import { S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  S3StorageDriver,
  type StorageDriver,
} from '@hdotu1/media-storage/drivers';

export const TRANSFORM_STORAGE = 'TRANSFORM_STORAGE';

export const TransformStorageProvider: Provider<StorageDriver> = {
  provide: TRANSFORM_STORAGE,
  useFactory: (configService: ConfigService) => {
    const { bucket, ...config } = configService.get('s3');
    return new S3StorageDriver({
      client: new S3Client(config as S3ClientConfig),
      bucket
    });
  },
  inject: [ConfigService],
};
