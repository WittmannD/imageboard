import { Keyv } from '@keyv/redis';
import type { Provider } from '@nestjs/common';
import type { AdapterFactory } from 'oidc-provider';

import { KEYV_STORE } from '../../keyv-store/keyv-store.provider.js';
import { SessionStoreAdapterFactory } from './oidc-session-store-adapter.js';


export const OIDC_SESSION_STORE = Symbol('OIDC_SESSION_STORE');
export const OidcSessionStoreProvider = {
  provide: OIDC_SESSION_STORE,
  useFactory: (keyv: Keyv) => {
    return SessionStoreAdapterFactory(keyv);
  },
  inject: [KEYV_STORE]
} satisfies Provider<AdapterFactory>;
