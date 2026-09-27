import path from 'path';
import type { DataSourceOptions } from 'typeorm';

import {
  getConfig,
  identityProviderSecrets,
  loadSecrets,
} from '@hdotu1/config';

const databaseSecrets = identityProviderSecrets.pick({
  DB_USER: true,
  DB_PASS: true,
});

/** Connection options shared by the app and the migrations CLI (src/migrations.data-source.ts). */
export function createDataSourceConfig(): DataSourceOptions {
  const { database } = getConfig();
  const secrets = loadSecrets(databaseSecrets);

  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    username: secrets.DB_USER,
    password: secrets.DB_PASS,
    database: database.names.identity,
    dropSchema: database.dropSchema,
    // The schema is owned by the migrations in every environment.
    synchronize: false,
    migrationsRun: true,
    migrationsTableName: 'migrations',
    migrations: [path.resolve(import.meta.dirname, '../migrations/*{.ts,.js}')],
    ssl: database.ssl ? { rejectUnauthorized: false } : false,
  };
}

export default () => ({
  dataSource: createDataSourceConfig(),
});
