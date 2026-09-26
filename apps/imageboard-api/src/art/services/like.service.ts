import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import { adjustCounter } from '../../common/utils/counter.js';
import { UserEntity } from '../../user/entities/user.entity.js';
import type { LikeStatusDto } from '../dto/like-status.dto.js';
import { PostEntity } from '../entities/post.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';
import { PostNotFoundError } from '../errors/post-service-error.js';
import { LikeRepository } from '../repositories/like.repository.js';
import { PostRepository } from '../repositories/post.repository.js';

@Injectable()
export class LikeService {
  constructor(
    private readonly likeRepository: LikeRepository,
    private readonly postRepository: PostRepository,
    private readonly tx: TransactionService,
  ) {}

  // Liking is idempotent: the counters only move when a like row is actually
  // inserted or deleted, so repeated or concurrent requests can't skew them
  async likePost(user: UserEntity, postId: number, em?: EntityManager) {
    return await this.changeLike(user, postId, true, em);
  }

  async unlikePost(user: UserEntity, postId: number, em?: EntityManager) {
    return await this.changeLike(user, postId, false, em);
  }

  /** The subset of `postIds` the user has liked. */
  async getLikedPostIds(
    user: UserEntity,
    postIds: number[],
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) =>
      entityManager
        .withRepository(this.likeRepository)
        .findLikedPostIds(user.id, postIds),
    );
  }

  private async changeLike(
    user: UserEntity,
    postId: number,
    liked: boolean,
    em?: EntityManager,
  ): Promise<LikeStatusDto> {
    return await this.tx.withManager(em, async (entityManager) => {
      const postRepository = entityManager.withRepository(this.postRepository);
      const likeRepository = entityManager.withRepository(this.likeRepository);

      const post = await postRepository.findOne({
        select: { id: true, likesCount: true, user: { id: true } },
        relations: { user: true },
        where: { id: postId, status: PostStatus.Published },
      });

      if (!post) {
        throw new PostNotFoundError();
      }

      const changed = liked
        ? await likeRepository.insertIfAbsent(user.id, post.id)
        : await likeRepository.deleteByUserAndPost(user.id, post.id);

      let likesCount = post.likesCount;

      if (changed) {
        const delta = liked ? 1 : -1;
        await adjustCounter(entityManager, PostEntity, post.id, 'likesCount', delta);

        // re-read rather than add delta: concurrent likes may have landed
        // since the post was loaded
        likesCount = (
          await postRepository.findOneOrFail({
            select: { id: true, likesCount: true },
            where: { id: post.id },
          })
        ).likesCount;
      }

      return { postId: post.id, likesCount, likedByMe: liked };
    });
  }
}
