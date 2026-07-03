import type { EventEmitter } from 'node:events';

import type { StorageDriver } from '@hdotu1/media-storage/drivers';

export interface OperationContext {
  uuid: string;
  storage: StorageDriver;
  eventEmitter: EventEmitter;
}

export const createOperationContext = (
  uuid: string,
  storage: StorageDriver,
  eventEmitter: EventEmitter,
) => ({ uuid, storage, eventEmitter });
