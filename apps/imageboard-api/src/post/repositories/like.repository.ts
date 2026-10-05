import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { type DataSource, In, Repository } from 'typeorm';

import { prototypeToObject } from '../../common/utils/object.js';
import { LikeEntity } from '../entities/like.entity.js';

export class LikeRepository extends Repository<LikeEntity> {
  /** Inserts the like unless it exists; resolves to whether a row was added. */
  async insertIfAbsent(userId: number, postId: number): Promise<boolean> {
    const result = await this.createQueryBuilder()
      .insert()
      .values({ user: { id: userId }, post: { id: postId } })
      .orIgnore()
      .returning('id')
      .execute();

    // Postgres returns the inserted rows; a conflict inserts none
    return (result.raw as unknown[]).length > 0;
  }

  /** Resolves to whether a like was removed. */
  async deleteByUserAndPost(userId: number, postId: number): Promise<boolean> {
    const result = await this.delete({
      user: { id: userId },
      post: { id: postId },
    });

    return (result.affected ?? 0) > 0;
  }

  /** The subset of `postIds` the user has liked. */
  async findLikedPostIds(userId: number, postIds: number[]) {
    if (postIds.length === 0) {
      return new Set<number>();
    }

    const rows = await this.find({
      select: { id: true, post: { id: true } },
      relations: { post: true },
      where: { user: { id: userId }, post: { id: In(postIds) } },
    });

    return new Set(rows.map((like) => like.post.id));
  }
}

export const LikeRepositoryProvider = {
  provide: LikeRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(LikeEntity)
      .extend(prototypeToObject(LikeRepository.prototype));
  },
} satisfies Provider;
