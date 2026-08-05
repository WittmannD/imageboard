import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
  openid: ['sub'],
  profile: ['family_name', 'given_name'],
  email: ['email', 'email_verified'],
} satisfies OIDCDefinedConfig<'claims'>);
