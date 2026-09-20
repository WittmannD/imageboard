import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// tsc compiles this file to dist/get-styles.js; the `build` script compiles
// src/styles.css to dist/styles.css right next to it, so this always reads
// the version that shipped with this build.
const stylesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'styles.css',
);

export const compiledStyles = readFileSync(stylesPath, 'utf-8');
