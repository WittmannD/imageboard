import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
  url: (_context, interaction) => `/interactions/${interaction.uid}`,
} satisfies OIDCDefinedConfig<'interactions'>)