import type { ClientMetadata } from 'oidc-provider';

import {
  getConfig,
  identityProviderSecrets,
  loadSecrets,
} from '@hdotu1/config';

import type { OIDCDefinedConfig } from '../types/config.js';

const imageboardClient = (): ClientMetadata => {
  const { identityProvider, urls } = getConfig();

  return {
    client_id: identityProvider.oidc.client.id,
    client_secret: loadSecrets(identityProviderSecrets).OIDC_CLIENT_SECRET,
    client_name: identityProvider.oidc.client.name,
    redirect_uris: [...urls.oidcRedirectUris],
    post_logout_redirect_uris: [...urls.oidcPostLogoutRedirectUris],
    response_types: ['code'],
    grant_types: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_method: 'client_secret_post',
  };
};

export default () => [imageboardClient()] satisfies OIDCDefinedConfig<'clients'>;
