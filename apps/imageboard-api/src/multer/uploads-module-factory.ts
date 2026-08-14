import { randomUUID } from 'node:crypto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import type { FileUpload } from './file-upload.js';

const filenameFactory = (
  _req: Express.Request,
  file: FileUpload,
  callback: (error: Error | null, filename: string) => void,
) => {
  const uuid = randomUUID();
  file.uuid = uuid;

  callback(null, uuid);
};

export const UploadsModuleFactory = () =>
  MulterModule.registerAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      storage: diskStorage({
        destination: configService.get<string>('uploads.destination'),
        filename: filenameFactory,
      }),
    }),
    inject: [ConfigService],
  });
