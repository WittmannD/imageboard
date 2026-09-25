import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { adjustCounter } from '../../common/utils/counter.js';
import { prototypeToObject } from '../../common/utils/object.js';
import { UserEntity } from '../entities/user.entity.js';

export class UserRepository extends Repository<UserEntity> {
  async incrementReceivedLikes(userId: UserEntity['id']) {
    await adjustCounter(
      this.manager,
      UserEntity,
      userId,
      'likesReceivedCount',
      1,
    );
  }

  async decrementReceivedLikes(userId: UserEntity['id']) {
    await adjustCounter(
      this.manager,
      UserEntity,
      userId,
      'likesReceivedCount',
      -1,
    );
  }
}

export const UserRepositoryProvider = {
  provide: UserRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(UserEntity)
      .extend(prototypeToObject(UserRepository.prototype));
  },
} satisfies Provider;
