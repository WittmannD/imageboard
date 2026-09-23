import { getConfig } from '@hdotu1/config';

import type { OIDCDefinedConfig } from '../types/config.js';

export default () => {
  const { ttl } = getConfig().identityProvider.oidc;

  return {
    AccessToken: function AccessTokenTTL(_context, token, _client) {
      return token.resourceServer?.accessTokenTTL ?? ttl.accessToken;
    },
    AuthorizationCode: ttl.authorizationCode,
    BackchannelAuthenticationRequest:
      function BackchannelAuthenticationRequestTTL(context, _request, _client) {
        if (context.oidc.params?.['requested_expiry']) {
          // requested_expiry or the configured TTL, whichever is shorter
          return Math.min(ttl.backchannelAuthenticationRequest, +context.oidc.params['requested_expiry']);
        }

        return ttl.backchannelAuthenticationRequest;
      },
    ClientCredentials: function ClientCredentialsTTL(_context, token, _client) {
      return token.resourceServer?.accessTokenTTL ?? ttl.clientCredentials;
    },
    DeviceCode: ttl.deviceCode,
    IdToken: ttl.idToken,
    Interaction: ttl.interaction,
    PreAuthorizedCode: ttl.preAuthorizedCode,
    RefreshToken: function RefreshTokenTTL(context, token, client) {
      if (
        context.oidc.entities.RotatedRefreshToken &&
        client.applicationType === 'web' &&
        client.clientAuthMethod === 'none' &&
        !token.isSenderConstrained()
      ) {
        // Non-Sender Constrained SPA RefreshTokens do not have infinite expiration through rotation
        return context.oidc.entities.RotatedRefreshToken.remainingTTL;
      }

      return ttl.refreshToken;
    },
    Grant: ttl.grant,
    Session: ttl.session,
  } satisfies OIDCDefinedConfig<'ttl'>;
};