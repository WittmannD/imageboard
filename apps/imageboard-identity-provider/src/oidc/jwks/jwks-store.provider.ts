import type { Provider } from '@nestjs/common';

import { JwksEncryptionService } from './jwks-encryption.service.js';
import { JwksKeyRepository } from './jwks-key.repository.js';
import { JwksPostgresStoreFactory, type JwksStore } from './jwks-postgres-store.js';

export const JWKS_STORE = Symbol('JWKS_STORE');
export const JwksStoreProvider = {
  provide: JWKS_STORE,
  useFactory: (jwksKeyRepository: JwksKeyRepository, encryption: JwksEncryptionService) =>
    JwksPostgresStoreFactory(jwksKeyRepository, encryption),
  inject: [JwksKeyRepository, JwksEncryptionService],
} satisfies Provider<JwksStore>;
