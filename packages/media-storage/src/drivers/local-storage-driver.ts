import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import * as streamPromises from 'node:stream/promises';

import type { FileMetadata, StoredFile, UploadFile } from '../common/file.js';
import type { UploadFileOptions } from '../common/options.js';
import type { ReadableStorage, WritableStorage } from '../common/storage.js';
import { AlreadyExistsError } from '../errors/already-exists-error.js';
import { StorageError } from '../errors/storage-error.js';
import { errorFromCode } from '../helpers/error-from-code.js';
import { InvalidKeyError } from '../errors/index.js';

export interface LocalStorageDriverOptions {
  root: string;
}

export class LocalStorageDriver implements ReadableStorage, WritableStorage {
  private readonly root: string;

  constructor(options: LocalStorageDriverOptions) {
    this.root = path.resolve(options.root);
  }

  async upload(
    file: UploadFile,
    options: UploadFileOptions = {},
  ): Promise<StoredFile> {
    const { overwrite = true } = options;
    const originalPath = this.resolve(file.key);
    const tmpPath = this.getTempPath(originalPath);

    if ((await this.exists(originalPath)) && !overwrite) {
      throw new AlreadyExistsError('File already exists');
    }

    await fsPromises.mkdir(path.dirname(originalPath), {
      recursive: true,
    });

    try {
      // atomically write the file, later rename it to the original name
      if (Buffer.isBuffer(file.body)) {
        await fs.promises.writeFile(tmpPath, file.body);
      } else {
        await streamPromises.pipeline(file.body, fs.createWriteStream(tmpPath));
      }

      const info = await fsPromises.stat(tmpPath);
      await fsPromises.rename(tmpPath, originalPath);

      return {
        key: file.key,
        size: info.size,
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw errorFromCode(error.code as string);
      }

      throw new StorageError('Failed to upload object');
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async download(key: string) {
    try {
      return fs.createReadStream(this.resolve(key));
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw errorFromCode(error.code as string);
      }

      throw new StorageError('Failed to download object');
    }
  }

  async delete(key: string) {
    try {
      await fsPromises.unlink(this.resolve(key));
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw errorFromCode(error.code as string);
      }

      throw new StorageError('Failed to delete object');
    }
  }

  async exists(key: string) {
    try {
      await fsPromises.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async stat(key: string): Promise<FileMetadata> {
    try {
      const info = await fsPromises.stat(this.resolve(key));
      return {
        key,
        size: info.size,
        lastModified: info.mtime,
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        throw errorFromCode(error.code as string);
      }

      throw new StorageError('Failed get object metadata');
    }
  }

  private getTempPath(key: string) {
    const dirname = path.dirname(key);
    const basename = path.basename(key);
    const uuid = crypto.randomUUID();

    return path.join(dirname, `.${basename}-${uuid}.tmp`);
  }

  private resolve(key: string) {
    const normalized = path.normalize(key);

    const full = path.resolve(this.root, normalized);

    if (!full.startsWith(this.root)) {
      throw new InvalidKeyError('Invalid storage key');
    }

    return full;
  }
}
