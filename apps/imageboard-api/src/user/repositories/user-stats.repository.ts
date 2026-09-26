import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { prototypeToObject } from '../../common/utils/object.js';
import { UserStatsEntity } from '../entities/user-stats.entity.js';

export class UserStatsRepository extends Repository<UserStatsEntity> {}

export const UserStatsRepositoryProvider = {
  provide: UserStatsRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(UserStatsEntity)
      .extend(prototypeToObject(UserStatsRepository.prototype));
  },
} satisfies Provider;
