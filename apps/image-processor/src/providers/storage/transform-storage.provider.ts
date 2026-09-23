import { S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '@hdotu1/config';
import {
  S3StorageDriver,
  type StorageDriver,
} from '@hdotu1/media-storage/drivers';

export const TRANSFORM_STORAGE = 'TRANSFORM_STORAGE';

export const TransformStorageProvider: Provider<StorageDriver> = {
  provide: TRANSFORM_STORAGE,
  useFactory: (configService: ConfigService) => {
    const { bucket, ...s3 } = configService.getOrThrow<
      AppConfig['imageProcessor']['s3']
    >('imageProcessor.s3');
    const config: S3ClientConfig = {
      ...s3,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('secrets.S3_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>(
          'secrets.S3_SECRET_ACCESS_KEY',
        ),
      },
    };

    return new S3StorageDriver({
      client: new S3Client(config),
      bucket,
    });
  },
  inject: [ConfigService],
};
