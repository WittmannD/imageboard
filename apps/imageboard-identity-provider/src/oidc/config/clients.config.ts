import type { ClientMetadata } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';

const imageboardClient = {
  client_id: process.env['OIDC_CLIENT_ID'] ?? '',
  client_secret: process.env['OIDC_CLIENT_SECRET'],
  client_name: process.env['OIDC_CLIENT_NAME'] ?? 'Imageboard',
  redirect_uris:
    process.env['OIDC_CLIENT_REDIRECT_URIS']?.split(/\s*,\s*/) ?? [],
  post_logout_redirect_uris:
    process.env['OIDC_CLIENT_POST_LOGOUT_REDIRECT_URIS']?.split(/\s*,\s*/) ??
    [],
  response_types: ['code'],
  grant_types: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_method: 'client_secret_post',
} satisfies ClientMetadata;

export default () => [imageboardClient] satisfies OIDCDefinedConfig<'clients'>;
