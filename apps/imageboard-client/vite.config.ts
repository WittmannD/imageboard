import * as path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({

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
