/**
 * The data source of the TypeORM CLI (`npm run migration:*`). The CLI loads the
 * compiled file from dist: tsx strips the decorator metadata that TypeORM needs
 * to infer column types. On the host, MIGRATIONS_DB_HOST/MIGRATIONS_DB_PORT point
 * it at the published port of the Postgres container.
 */
import path from 'path';
import { DataSource } from 'typeorm';

import { loadRootEnvFile } from '@hdotu1/config';

import { createDataSourceConfig } from './config/data-source.config.js';

loadRootEnvFile();

const options = createDataSourceConfig();
const { MIGRATIONS_DB_HOST, MIGRATIONS_DB_PORT } = process.env;

export default new DataSource({
  ...options,
  ...(MIGRATIONS_DB_HOST && { host: MIGRATIONS_DB_HOST }),
  ...(MIGRATIONS_DB_PORT && { port: Number(MIGRATIONS_DB_PORT) }),
  entities: [path.resolve(import.meta.dirname, '**/*.entity.{ts,js}')],
  dropSchema: false,
  migrationsRun: false,
});
