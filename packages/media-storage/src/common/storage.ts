import type { Readable } from 'node:stream';

import type { ObjectMetadata, StoredObject, UploadObject } from './object.js';
import type { SignedUrlOptions, UploadObjectOptions } from './options.js';

export interface ReadableStorage {
  download(key: string): Promise<Readable>;
}

export interface WritableStorage {
  upload(file: UploadObject, options?: UploadObjectOptions): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

export interface ListingStorage {
  list(prefix?: string): AsyncIterable<ObjectMetadata>;
}

export interface SignedUrlStorage {
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}
