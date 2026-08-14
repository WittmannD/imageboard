import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { prototypeToObject } from '../../common/utils/object.js';
import { FederatedCredentialsEntity } from '../entities/federated-credentials.entity.js';

export class FederatedCredentialsRepository extends Repository<FederatedCredentialsEntity> {}

export const FederatedCredentialsRepositoryProvider = {
  provide: FederatedCredentialsRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(FederatedCredentialsEntity)
      .extend(prototypeToObject(FederatedCredentialsRepository.prototype));
  },
} satisfies Provider;
