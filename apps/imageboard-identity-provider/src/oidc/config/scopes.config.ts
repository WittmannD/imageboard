import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'scopes'> => [
  'openid',
  'profile',
  'email',
  'offline_access',
];
