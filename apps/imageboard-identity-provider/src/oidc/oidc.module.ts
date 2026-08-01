import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module.js';
import { OidcController } from './oidc.controller.js';
import { OIDC_PROVIDER, OidcProvider } from './oidc.provider.js';
import { OidcService } from './oidc.service.js';
import { RedisAdapterProvider } from './oidc-storage-adapter.provider.js';
import { RedisStoreProvider } from './oidc-store.provider.js';

@Module({
  imports: [
    UserModule
  ],
  controllers: [OidcController],
  providers: [
    RedisStoreProvider,
    RedisAdapterProvider,
    OidcService,
    OidcProvider,
  ],
  exports: [OIDC_PROVIDER]
})
export class OidcModule {}