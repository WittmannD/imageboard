import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { getConfig, toPublicConfig } from '@hdotu1/config';

// The APP_ENV profile the client is built for - see @hdotu1/config.
const config = getConfig();

// The apps share one version (see bin/nx-release.ts), so the client's own
// package.json holds the project version.
const { version } = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
) as { version: string };

// CI passes the commit as a build arg (the image has no git); locally ask git.
function resolveCommit(): string | null {
  if (process.env.GIT_COMMIT_SHA) {
    return process.env.GIT_COMMIT_SHA;
  }

  try {
    return execSync('git rev-parse HEAD', {
      cwd: import.meta.dirname,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Inlined into the bundle; only ever the browser-safe subset.
    __PUBLIC_CONFIG__: JSON.stringify(toPublicConfig(config)),
    __BUILD_INFO__: JSON.stringify({ version, commit: resolveCommit() }),
  },
  server: {
    allowedHosts: [`.${config.domain}`, config.domain],
  },
  resolve: {
    alias: {
      src: path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [tailwindcss(), reactRouter()],
});
