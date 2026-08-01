import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { prototypeToObject } from '../../common/utils/object.js';
import { CredentialsEntity } from '../entities/credentials.entity.js';

export class CredentialsRepository extends Repository<CredentialsEntity> {

}

export const CredentialsRepositoryProvider = {
  provide: CredentialsRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(CredentialsEntity)
      .extend(prototypeToObject(CredentialsRepository.prototype));
  },
} satisfies Provider;
