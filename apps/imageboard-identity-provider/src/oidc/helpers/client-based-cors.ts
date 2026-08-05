
import { CORS_METADATA_PROPERTY } from '../config/extra-client-metadata.config.js';
import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'clientBasedCORS'> =>
  (context, origin, client) => {
    const corsConfigured = client[CORS_METADATA_PROPERTY] !== undefined;

    if (!corsConfigured) {
      // If the client is not configured to use CORS, only allow the userinfo route
      // for the origins specified in the redirect_uris
      if (
        context.oidc.route === 'userinfo' ||
        client.clientAuthMethod === 'none'
      ) {
        return Boolean(
          client.redirectUris?.some((uri) => URL.parse(uri)?.origin === origin),
        );
      }
      return false;
    }

    return (Array.isArray(client[CORS_METADATA_PROPERTY]) &&
      client[CORS_METADATA_PROPERTY].includes(origin)) satisfies boolean;
  };
