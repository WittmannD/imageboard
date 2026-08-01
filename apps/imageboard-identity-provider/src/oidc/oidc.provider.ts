import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IdProvider, { type AdapterFactory } from 'oidc-provider';

import { KEYV_STORAGE_ADAPTER } from './oidc-storage-adapter.provider.js';
import { oidcConfiguration } from './oidc.config.js';
import { OidcService } from './oidc.service.js';

export const OIDC_PROVIDER = Symbol('OIDC_PROVIDER');
export const OidcProvider = {
  provide: OIDC_PROVIDER,
  useFactory: (
    oidcService: OidcService,
    configService: ConfigService,
    adapter: AdapterFactory,
  ) => {
    return new IdProvider(configService.getOrThrow<string>('ISSUER_URL'), {
      ...oidcConfiguration,
      adapter,
      pkce: {
        required: () => true,
      },
      interactions: {
        url: (_context, interaction) => {
          return new URL(
            `?uid=${interaction.uid}`,
            configService.getOrThrow('INTERACTIONS_BASE_URL'),
          ).href;
        },
      },
      findAccount: async (_context, accountId) =>
        oidcService.findAccount(accountId),
    });
  },
  inject: [OidcService, ConfigService, KEYV_STORAGE_ADAPTER],
} satisfies Provider<IdProvider>;
