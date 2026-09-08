import { errors } from 'oidc-provider';

import type { OIDCDefinedFeatureConfig } from '../types/config.js';

// imageboard-api is the only resource server behind this issuer, so every
// access token is scoped to it by default - no client ever has to request it
// by name via the `resource` parameter.
export const API_RESOURCE_IDENTIFIER = process.env['IMAGEBOARD_API_URL'] ?? '';

export default (): Omit<
  OIDCDefinedFeatureConfig<'resourceIndicators'>,
  'enabled'
> => ({
  // called when the client omits `resource`. `oneOf` is only passed when
  // the request must resolve to exactly one already-granted resource —
  // you must return a member of it.
  defaultResource(_ctx, _client, oneOf) {
    if (oneOf) return oneOf.includes(API_RESOURCE_IDENTIFIER)
      ? API_RESOURCE_IDENTIFIER
      : oneOf[0];
    return API_RESOURCE_IDENTIFIER;
  },

  getResourceServerInfo(_ctx, resourceIndicator, _client) {
    if (resourceIndicator !== API_RESOURCE_IDENTIFIER)
      throw new errors.InvalidTarget();
    return {
      scope: 'api:read api:write',

      // ends up as `aud` claim
      audience: API_RESOURCE_IDENTIFIER,

      // OPTIONAL
      // Issued Token TTL as a positive safe integer number of seconds
      // Default is - see `ttl` configuration
      // accessTokenTTL: 10 * 60,

      // Issued Token Format
      // Default is - opaque
      accessTokenFormat: 'jwt',

      // must match a key alg actually present in the keystore (see
      // jwks-postgres-store.ts, which only generates RS256 keys)
      jwt: { sign: { alg: 'RS256' } },
    };
  },

  useGrantedResource: () => true,
});
