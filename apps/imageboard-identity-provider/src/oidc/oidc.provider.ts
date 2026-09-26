import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IdProvider, { type AdapterFactory } from 'oidc-provider';

import { UserService } from '../user/user.service.js';
import clientBasedCors from './helpers/client-based-cors.js';
import extraTokenClaims from './helpers/extra-token-claims.js';
import createFindAccount from './helpers/find-account.js';
import pairwiseIdentifier from './helpers/pairwise-identifier.js';
import renderError from './helpers/render-error.js';
import rotateRefreshToken from './helpers/rotate-refresh-token.js';
import type { JwksStore } from './jwks/jwks-postgres-store.js';
import { JWKS_STORE } from './jwks/jwks-store.provider.js';
import oidcConfiguration from './oidc.config.js';
import { OIDC_SESSION_STORE } from './session/oidc-session-store.provider.js';

export const OIDC_PROVIDER = Symbol('OIDC_PROVIDER');
export const OidcProvider = {
  provide: OIDC_PROVIDER,
  useFactory: async (
    configService: ConfigService,
    userService: UserService,
    adapter: AdapterFactory,
    jwksStore: JwksStore,
  ) => {
    const jwks = await jwksStore.getJwks();
    const findAccount = createFindAccount(userService);

    const provider = new IdProvider(configService.getOrThrow<string>('urls.auth'), {
      ...oidcConfiguration(),
      jwks,
      adapter,
      findAccount,
      extraTokenClaims: extraTokenClaims(findAccount),
      clientBasedCORS: clientBasedCors(),
      pairwiseIdentifier: pairwiseIdentifier(),
      renderError: renderError(),
      rotateRefreshToken: rotateRefreshToken(),
    });

    // nginx terminates TLS; trust its X-Forwarded-Proto so secure cookies work.
    provider.proxy = true;

    return provider;
  },
  inject: [ConfigService, UserService, OIDC_SESSION_STORE, JWKS_STORE],
} satisfies Provider<IdProvider>;
