import type { Readable } from 'node:stream';

export interface UploadObject {
  key: string;
  body: Readable | Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StoredObject {
  key: string;
  size: number;
  etag?: string;
}

export interface ObjectMetadata {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}
