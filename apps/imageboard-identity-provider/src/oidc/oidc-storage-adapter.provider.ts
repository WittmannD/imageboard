import { Keyv } from '@keyv/redis';
import type { Provider } from '@nestjs/common';
import type { AdapterFactory } from 'oidc-provider';

import { KEYV_STORE } from '../keyv-store/keyv-store.provider.js';
import { KeyvAdapterFactory } from './oidc-storage-adapter.js';


export const KEYV_STORAGE_ADAPTER = Symbol('KEYV_STORAGE_ADAPTER');
export const KeyvStorageAdapterProvider = {
  provide: KEYV_STORAGE_ADAPTER,
  useFactory: (keyvStore: Keyv) => {
    return KeyvAdapterFactory(keyvStore);
  },
  inject: [KEYV_STORE]
} satisfies Provider<AdapterFactory>;
