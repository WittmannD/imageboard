import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IdProvider, { type AdapterFactory, type ClientMetadata, } from 'oidc-provider';

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
      clients: [configService.getOrThrow<ClientMetadata>('oidcClient')],
      loadExistingGrant: async (context) => {
        const grantId =
          context.oidc.result?.consent?.grantId ??
          (context.oidc.client &&
            context.oidc.session?.grantIdFor(context.oidc.client.clientId));

        if (grantId) {
          return context.oidc.provider.Grant.find(grantId);
        }

        const scope = context.oidc.params?.['scope'] as string | undefined;

        // If the client is trusted, grant with all scopes
        if (
          context.oidc.client?.metadata()['trusted'] &&
          context.oidc.result?.login
        ) {
          const grant = new context.oidc.provider.Grant({
            accountId: context.oidc.result.login.accountId,
            clientId: context.oidc.client.clientId,
          });
          grant.addOIDCScope(scope ?? 'openid');
          await grant.save();
          return grant;
        }

        return undefined;
      },
      interactions: {
        url: (_context, interaction) => `/interactions/${interaction.uid}`,
      },
      findAccount: async (_context, accountId) =>
        oidcService.findAccount(accountId),
    });
  },
  inject: [OidcService, ConfigService, KEYV_STORAGE_ADAPTER],
} satisfies Provider<IdProvider>;
