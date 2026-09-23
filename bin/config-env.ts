/**
 * Writes the flat env view of a configuration profile for consumers that
 * cannot import TypeScript (docker compose interpolation, the nginx template):
 *
 *   tsx bin/config-env.ts <development|e2e|production> [out-file]
 *
 * The default output is .generated/config.<profile>.env; pass `-` to print to
 * stdout instead. Imports the package source, so no build is needed first.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import {
  formatEnvFile,
  getConfig,
  resolveAppEnv,
  toComposeEnv,
} from '../packages/config/src/index.js';

const env = resolveAppEnv(process.argv[2]);
const out =
  process.argv[3] ??
  path.resolve(import.meta.dirname, '..', '.generated', `config.${env}.env`);
const content = formatEnvFile(toComposeEnv(getConfig(env)));

if (out === '-') {
  process.stdout.write(content);
} else {
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, content);
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);
}
