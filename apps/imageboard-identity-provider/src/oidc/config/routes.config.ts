import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
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
} satisfies OIDCDefinedConfig<'routes'>);
