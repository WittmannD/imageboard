import { createWriteStream } from 'node:fs';
import * as path from 'node:path';
import type { Writable } from 'node:stream';

import {
  type MediaStorage,
  type MediaStorageOptions,
} from './media-storage.js';

export interface FsMediaStorageOptions extends MediaStorageOptions {
  basePath: string;
}

export class FsMediaStorage implements MediaStorage {
  constructor(private readonly options: FsMediaStorageOptions) {}

  writableStream(key: string): Writable {
    return createWriteStream(
      path.join(path.resolve(this.options.basePath), key),
      {
        encoding: 'binary',
      },
    );
  }
}
