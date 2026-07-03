import type { Readable } from 'node:stream';

import type { FileMetadata,StoredFile, UploadFile } from './file.js';
import type { SignedUrlOptions, UploadFileOptions } from './options.js';

export interface ReadableStorage {
  download(key: string): Promise<Readable>;
}

export interface WritableStorage {
  upload(file: UploadFile, options?: UploadFileOptions): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

export interface ListingStorage {
  list(prefix?: string): AsyncIterable<FileMetadata>;
}

export interface SignedUrlStorage {
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}
