import { Readable } from 'node:stream'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MediaSourceConfig = Record<string, any>;

export interface MediaSource {
  get(key: string): Readable
}

export const MEDIA_SOURCE = 'MEDIA_SOURCE';
