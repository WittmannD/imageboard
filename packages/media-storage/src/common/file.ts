import type { Readable } from 'node:stream';

export interface UploadFile {
  key: string;
  body: Readable | Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StoredFile {
  key: string;
  size: number;
  etag?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}
