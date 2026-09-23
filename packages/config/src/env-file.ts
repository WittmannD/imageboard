import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

function findRepoRoot(from: string): string | undefined {
  let dir = path.resolve(from);

  // The filesystem root is its own parent.
  while (dir !== path.dirname(dir)) {
    const packageJson = path.join(dir, 'package.json');

    if (
      existsSync(packageJson) &&
      'workspaces' in JSON.parse(readFileSync(packageJson, 'utf8'))
    ) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  return undefined;
}

/**
 * Loads the monorepo's root `.env` (secrets) into `process.env`, if there is
 * one. Variables already set win, so containers - which get their secrets from
 * compose and have no such file - are unaffected.
 */
export function loadRootEnvFile(from = process.cwd()): void {
  const root = findRepoRoot(from);
  const file = root && path.join(root, '.env');

  if (file && existsSync(file)) {
    process.loadEnvFile(file);
  }
}
