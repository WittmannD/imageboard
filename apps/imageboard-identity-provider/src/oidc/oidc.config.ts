import type { Configuration } from 'oidc-provider';

export const oidcConfiguration: Readonly<Configuration> = {
  features: {
    devInteractions: { enabled: false },
    introspection: { enabled: true },
    revocation: { enabled: true },
  },

  scopes: ['openid', 'profile', 'email'],

  claims: {
    openid: ['sub'],
    profile: ['family_name', 'given_name'],
    email: ['email', 'email_verified'],
  },

  routes: {
    authorization: '/auth',
    backchannel_authentication: '/backchannel',
    // challenge: '/challenge',
    code_verification: '/device',
    // credential: '/credential',
    device_authorization: '/device/auth',
    end_session: '/session/end',
    introspection: '/token/introspection',
    jwks: '/jwks',
    pushed_authorization_request: '/request',
    registration: '/reg',
    revocation: '/token/revocation',
    token: '/token',
    userinfo: '/me',
  },

  extraClientMetadata: {
    properties: ['trusted']
  },
};