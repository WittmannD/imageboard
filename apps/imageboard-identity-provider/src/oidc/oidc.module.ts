import { Module } from '@nestjs/common';

import { KeyvStoreModule } from '../keyv-store/keyv-store.module.js';
import { UserModule } from '../user/user.module.js';
import { OidcController } from './oidc.controller.js';
import { OIDC_PROVIDER, OidcProvider } from './oidc.provider.js';
import { OidcService } from './oidc.service.js';
import { KeyvStorageAdapterProvider } from './oidc-storage-adapter.provider.js';

@Module({
  imports: [UserModule, KeyvStoreModule],
  controllers: [OidcController],
  providers: [KeyvStorageAdapterProvider, OidcService, OidcProvider],
  exports: [OIDC_PROVIDER, OidcService],
})
export class OidcModule {}