import { createReadStream } from 'node:fs';
import * as path from 'node:path';
import { ConfigService } from '@nestjs/config';

import { IMAGE_PROCESSOR_CONFIG } from '../config/image-processor-config.js';
import type { MediaSource, MediaSourceConfig } from './media-source.js';

export interface FsMediaSourceConfig extends MediaSourceConfig {
  basePath: string;
}

export class FsMediaSource implements MediaSource {
  private config: FsMediaSourceConfig;

  constructor(private configService: ConfigService) {
    const mediaSourceConfig = this.configService.get<FsMediaSourceConfig>(
      `${IMAGE_PROCESSOR_CONFIG}.mediaSource`,
    );

    if (!mediaSourceConfig) {
      throw new Error('FsMediaSource config is missing');
    }

    this.config = mediaSourceConfig;
  }

  get(key: string) {
    return createReadStream(path.join(this.config.basePath, key));
  }
}
