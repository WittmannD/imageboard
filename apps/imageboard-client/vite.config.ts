import * as path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite'

import { getConfig, toPublicConfig } from '@hdotu1/config';

// The APP_ENV profile the client is built for - see @hdotu1/config.
const config = getConfig();

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Inlined into the bundle; only ever the browser-safe subset.
    __PUBLIC_CONFIG__: JSON.stringify(toPublicConfig(config)),
  },
  server: {
    allowedHosts: [`.${config.domain}`, config.domain]
  },
  resolve: {
    alias: {
      'src': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter()
  ],
});
