import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { prototypeToObject } from '../../common/utils/object.js';
import { JwksKeyEntity } from './jwks-key.entity.js';

export class JwksKeyRepository extends Repository<JwksKeyEntity> {}

export const JwksKeyRepositoryProvider = {
  provide: JwksKeyRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(JwksKeyEntity)
      .extend(prototypeToObject(JwksKeyRepository.prototype));
  },
} satisfies Provider;
