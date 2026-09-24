import { DataSource } from 'typeorm';

import { dataSourceConfig } from '../config/data-source.config.js';

/**
 * Use only for seeding.
 */
export const dataSource = new DataSource({ ...dataSourceConfig,  });
