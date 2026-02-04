import type { Writable } from 'node:stream';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MediaStorageConfig = Record<string, any>;

export interface MediaStorage {
  writableStream(key: string): Writable;
}

export const MEDIA_STORAGE = 'MEDIA_STORAGE';
