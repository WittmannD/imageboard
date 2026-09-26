import { ViewColumn, ViewEntity } from 'typeorm';

import { LikeEntity } from '../../art/entities/like.entity.js';
import { PostEntity } from '../../art/entities/post.entity.js';
import { PostStatus } from '../../art/enums/post-status.enum.js';
import { UserEntity } from './user.entity.js';

@ViewEntity({
  name: 'user_stats',
  expression: (dataSource) => {
    const postsCountSubquery = dataSource
      .createQueryBuilder()
      .subQuery()
      .select('post.userId', 'userId')
      .addSelect('COUNT(*)', 'postsCount')
      .from(PostEntity, 'post')
      .where(`post.status = '${PostStatus.Published}'`)
      .groupBy('post.userId')
      .getQuery();

    const likesReceivedSubquery = dataSource
      .createQueryBuilder()
      .subQuery()
      .select('post.userId', 'userId')
      .addSelect('COUNT(*)', 'likesReceived')
      .from(LikeEntity, 'like')
      .innerJoin(PostEntity, 'post', 'post.id = like.postId')
      .where(`post.status = '${PostStatus.Published}'`)
      .groupBy('post.userId')
      .getQuery();

    return dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .select('user.id', 'userId')
      .addSelect('COALESCE(posts."postsCount", 0)::int', 'postsCount')
      .addSelect('COALESCE(likes."likesReceived", 0)::int', 'likesReceived')
      .leftJoin(`(${postsCountSubquery})`, 'posts', 'posts."userId" = user.id')
      .leftJoin(
        `(${likesReceivedSubquery})`,
        'likes',
        'likes."userId" = user.id',
      );
  },
})
export class UserStatsEntity {
  @ViewColumn({ name: 'userId' })
  userId!: number;

  @ViewColumn({ name: 'postsCount' })
  postsCount!: number;

  @ViewColumn({ name: 'likesReceived' })
  likesReceived!: number;
}
