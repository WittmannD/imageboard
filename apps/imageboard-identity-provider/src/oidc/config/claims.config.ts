import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
  openid: ['sub'],
  profile: ['preferred_username'],
  email: ['email', 'email_verified'],
} satisfies OIDCDefinedConfig<'claims'>);
