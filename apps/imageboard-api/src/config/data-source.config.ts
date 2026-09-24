import type { DataSourceOptions } from 'typeorm';

import { apiSecrets, getConfig, loadSecrets } from '@hdotu1/config';

const { database } = getConfig();
const secrets = loadSecrets(apiSecrets);

export const dataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: database.host,
  port: database.port,
  username: secrets.DB_USER,
  password: secrets.DB_PASS,
  database: database.names.api,
  dropSchema: database.dropSchema,
  synchronize: database.synchronize,
  ssl: database.ssl ? { rejectUnauthorized: false } : false,
};

export default () => ({
  dataSource: dataSourceConfig
});
