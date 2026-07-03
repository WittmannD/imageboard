import type { ReadableStorage, WritableStorage } from '../common/storage.js';

export type StorageDriver = ReadableStorage & WritableStorage;
