import { Global, Module } from '@nestjs/common';

import { KEYV_STORE, KeyvStoreProvider } from './keyv-store.provider.js';

@Global()
@Module({
  imports: [],
  providers: [
    KeyvStoreProvider
  ],
  exports: [
    KEYV_STORE
  ]
})
export class KeyvStoreModule {}