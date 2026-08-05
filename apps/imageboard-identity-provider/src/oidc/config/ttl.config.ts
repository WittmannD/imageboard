import type { OIDCDefinedConfig } from '../types/config.js';

export default () =>
  ({
    AccessToken: function AccessTokenTTL(_context, token, _client) {
      return token.resourceServer?.accessTokenTTL ?? 60 * 60; // 1 hour in seconds
    },
    AuthorizationCode: 60 /* 1 minute in seconds */,
    BackchannelAuthenticationRequest:
      function BackchannelAuthenticationRequestTTL(context, _request, _client) {
        if (context.oidc.params?.['requested_expiry']) {
          return Math.min(10 * 60, +context.oidc.params['requested_expiry']); // 10 minutes in seconds or requested_expiry, whichever is shorter
        }

        return 10 * 60; // 10 minutes in seconds
      },
    ClientCredentials: function ClientCredentialsTTL(_context, token, _client) {
      return token.resourceServer?.accessTokenTTL ?? 10 * 60; // 10 minutes in seconds
    },
    DeviceCode: 600 /* 10 minutes in seconds */,
    IdToken: 3600 /* 1 hour in seconds */,
    Interaction: 3600 /* 1 hour in seconds */,
    PreAuthorizedCode: 600 /* 10 minutes in seconds */,
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

      return 21 * 24 * 60 * 60; // 21 days in seconds
    },
    Grant: 1209600 /* 14 days in seconds */,
    Session: 24 * 60 * 60 /* 24 hours in seconds */,
  }) satisfies OIDCDefinedConfig<'ttl'>;