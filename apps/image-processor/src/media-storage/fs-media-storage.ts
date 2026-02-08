import { createWriteStream } from 'node:fs';
import * as path from 'node:path';
import type { Writable } from 'node:stream';
import { ConfigService } from '@nestjs/config';

import { IMAGE_PROCESSOR_CONFIG } from '../config/image-processor-config.js';
import type { FsMediaSourceOptions } from '../media-source/fs-media-source.js';
import type { MediaStorage, MediaStorageConfig } from './media-storage.js';

export interface FsMediaStorageConfig extends MediaStorageConfig {
  basePath: string;
}

export class FsMediaStorage implements MediaStorage {
  private config: FsMediaSourceOptions;

  constructor(private configService: ConfigService) {
    const mediaStorageConfig = this.configService.get<FsMediaStorageConfig>(
      `${IMAGE_PROCESSOR_CONFIG}.mediaStorage`,
    );

    if (!mediaStorageConfig) {
      throw new Error('FsMediaStorage config is missing');
    }

    this.config = mediaStorageConfig;
  }

  writableStream(key: string): Writable {
    return createWriteStream(path.join(this.config.basePath, key), {
      encoding: 'binary',
    });
  }
}
