import type { Configuration } from 'oidc-provider';

import claimsConfig from './config/claims.config.js';
import clientsConfig from './config/clients.config.js';
import extraClientMetadataConfig from './config/extra-client-metadata.config.js';
import featuresConfig from './config/features.config.js';
import interactionsConfig from './config/interactions.config.js';
import pkceConfig from './config/pkce.config.js';
import routesConfig from './config/routes.config.js';
import scopesConfig from './config/scopes.config.js';
import ttlConfig from './config/ttl.config.js';
import cookiesConfig from './config/cookies.config.js';

export default () =>
  ({
    features: featuresConfig(),
    scopes: scopesConfig(),
    claims: claimsConfig(),
    routes: routesConfig(),
    clients: clientsConfig(),
    extraClientMetadata: extraClientMetadataConfig(),
    interactions: interactionsConfig(),
    pkce: pkceConfig(),
    cookies: cookiesConfig(),
    ttl: ttlConfig(),
    // jwks: [],
  }) satisfies Readonly<Configuration>;
