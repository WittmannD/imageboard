import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KeyvStoreModule } from '../keyv-store/keyv-store.module.js';
import { UserModule } from '../user/user.module.js';
import { JwksEncryptionService } from './jwks/jwks-encryption.service.js';
import { JwksKeyEntity } from './jwks/jwks-key.entity.js';
import { JwksKeyRepositoryProvider } from './jwks/jwks-key.repository.js';
import { JwksStoreProvider } from './jwks/jwks-store.provider.js';
import { OidcController } from './oidc.controller.js';
import { OIDC_PROVIDER, OidcProvider } from './oidc.provider.js';
import { OidcSessionStoreProvider } from './session/oidc-session-store.provider.js';

@Module({
  imports: [UserModule, KeyvStoreModule, TypeOrmModule.forFeature([JwksKeyEntity])],
  controllers: [OidcController],
  providers: [
    OidcSessionStoreProvider,
    JwksKeyRepositoryProvider,
    JwksEncryptionService,
    JwksStoreProvider,
    OidcProvider,
  ],
  exports: [OIDC_PROVIDER],
})
export class OidcModule {}