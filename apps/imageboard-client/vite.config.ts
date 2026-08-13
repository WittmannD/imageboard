import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import * as path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter()
  ],
});
