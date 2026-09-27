/**
 * Generates a TypeORM migration for the workspace it runs in, from the diff
 * between its entities and the database (`npm run migration:generate -w <app> -- <Name>`):
 *
 *   tsx ../../bin/migration-generate.ts <Name>
 *
 * Expects a fresh build in dist (the npm script runs `nest build` and applies
 * the pending migrations first). The generated file is then made to compile
 * under `verbatimModuleSyntax` (TypeORM imports its interfaces as values) and
 * formatted with the repo's Prettier config.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import * as prettier from 'prettier';

const name = process.argv[2];

if (!name || !/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
  console.error('Usage: npm run migration:generate -w <app> -- <MigrationName>');
  process.exit(1);
}

const cli = path.resolve(import.meta.dirname, '..', 'node_modules', 'typeorm', 'cli.js');
const dir = path.resolve('src', 'migrations');
const list = () => new Set(readdirSync(dir, { withFileTypes: true }).map((entry) => entry.name));

const before = list();

execFileSync(
  process.execPath,
  [cli, '-d', 'dist/migrations.data-source.js', 'migration:generate', '--pretty', path.join('src', 'migrations', name)],
  { stdio: 'inherit' },
);

for (const file of list()) {
  if (before.has(file)) {
    continue;
  }

  const filePath = path.join(dir, file);
  const source = readFileSync(filePath, 'utf8').replace(
    /^import \{ MigrationInterface, QueryRunner \} from "typeorm";/m,
    'import type { MigrationInterface, QueryRunner } from "typeorm";',
  );
  const options = await prettier.resolveConfig(filePath);

  writeFileSync(filePath, await prettier.format(source, { ...options, filepath: filePath }));
  console.log(`Formatted ${path.relative(process.cwd(), filePath)}`);
}
