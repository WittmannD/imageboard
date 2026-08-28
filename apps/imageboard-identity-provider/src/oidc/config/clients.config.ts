import type { ClientMetadata } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';
import { TRUSTED_METADATA_PROPERTY } from './extra-client-metadata.config.js';

const imageboardClient = {
  client_id: process.env['OIDC_CLIENT_ID'] ?? '',
  client_secret: process.env['OIDC_CLIENT_SECRET'],
  redirect_uris:
    process.env['OIDC_CLIENT_REDIRECT_URIS']?.split(/\s*,\s*/) ?? [],
  response_types: ['code'],
  grant_types: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_method: 'client_secret_post',
  // Give the client all grants
  [TRUSTED_METADATA_PROPERTY]: true,
} satisfies ClientMetadata;

export default () => [imageboardClient] satisfies OIDCDefinedConfig<'clients'>;
