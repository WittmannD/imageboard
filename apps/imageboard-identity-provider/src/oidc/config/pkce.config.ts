import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
  // Make it mandatory for each auth request
  required: () => true,
} satisfies OIDCDefinedConfig<'pkce'>)