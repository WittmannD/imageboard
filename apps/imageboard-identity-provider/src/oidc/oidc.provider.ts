import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IdProvider, { type AdapterFactory } from 'oidc-provider';

import { UserService } from '../user/user.service.js';
import clientBasedCors from './helpers/client-based-cors.js';
import createFindAccount from './helpers/find-account.js';
import loadExistingGrant from './helpers/load-existing-grant.js';
import pairwiseIdentifier from './helpers/pairwise-identifier.js';
import renderError from './helpers/render-error.js';
import rotateRefreshToken from './helpers/rotate-refresh-token.js';
import oidcConfiguration from './oidc.config.js';
import { KEYV_STORAGE_ADAPTER } from './oidc-storage-adapter.provider.js';

export const OIDC_PROVIDER = Symbol('OIDC_PROVIDER');
export const OidcProvider = {
  provide: OIDC_PROVIDER,
  useFactory: (
    configService: ConfigService,
    userService: UserService,
    adapter: AdapterFactory,
  ) => {
    return new IdProvider(configService.getOrThrow<string>('ISSUER_URL'), {
      ...oidcConfiguration(),
      adapter,
      findAccount: createFindAccount(userService),
      loadExistingGrant: loadExistingGrant(),
      clientBasedCORS: clientBasedCors(),
      // add 'pairwise' to list to enable pairwise subject identifier
      subjectTypes: ['public'],
      pairwiseIdentifier: pairwiseIdentifier(),
      renderError: renderError(),
      rotateRefreshToken: rotateRefreshToken(),
    });
  },
  inject: [ConfigService, UserService, KEYV_STORAGE_ADAPTER],
} satisfies Provider<IdProvider>;
