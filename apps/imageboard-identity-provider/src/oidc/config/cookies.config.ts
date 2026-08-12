import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
  names: {
    interaction: '_interaction',
    resume: '_interaction_resume',
    session: '_session'
  },
  short: {
    httpOnly: true,
    sameSite: 'none'
  },
  long: {
    httpOnly: true,
    sameSite: 'lax'
  }
} satisfies OIDCDefinedConfig<'cookies'>)