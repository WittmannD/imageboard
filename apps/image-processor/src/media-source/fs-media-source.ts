import { createReadStream } from 'node:fs';
import * as path from 'node:path';

import type { MediaSource, MediaSourceOptions } from './media-source.js';

export interface FsMediaSourceOptions extends MediaSourceOptions {
  basePath: string;
}

export class FsMediaSource implements MediaSource {
  constructor(private readonly options: FsMediaSourceOptions) {}

  get(key: string) {
    return createReadStream(path.join(this.options.basePath, key));
  }
}
