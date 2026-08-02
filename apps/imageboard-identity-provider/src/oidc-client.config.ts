import { registerAs } from '@nestjs/config';
import type { ClientMetadata } from 'oidc-provider';

export const OidcClientConfig = registerAs(
  'oidcClient',
  () =>
    ({
      client_id: process.env['OIDC_CLIENT_ID'] ?? '',
      client_secret: process.env['OIDC_CLIENT_SECRET'],
      redirect_uris: process.env['OIDC_CLIENT_REDIRECT_URIS']?.split(/\s*,\s*/) ?? [],
      response_types: ['code'],
      grant_types: ['authorization_code'],
      token_endpoint_auth_method: 'client_secret_post',
      // Give the client all grants
      trusted: true,
    }) satisfies ClientMetadata,
);
