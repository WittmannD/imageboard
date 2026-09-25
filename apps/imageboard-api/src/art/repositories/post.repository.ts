import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { type DataSource, type DeepPartial, Repository } from 'typeorm';

import type { PageMetadataDecoded } from '../../common/dto/page.dto.js';
import { prototypeToObject } from '../../common/utils/object.js';
import { PostEntity } from '../entities/post.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';
import { adjustCounter } from '../../common/utils/counter.js';

export type PostFeedItem = PostEntity & { likedByMe: boolean };

export interface PostPage extends PageMetadataDecoded<PostEntity> {
  items: PostFeedItem[];
}

export class PostRepository extends Repository<PostEntity> {
  createDraft(entityLike: DeepPartial<Omit<PostEntity, 'status'>>): PostEntity {
    return this.create({
      ...entityLike,
      status: PostStatus.Draft,
    });
  }

  async incrementLikes(postId: PostEntity['id']) {
    await adjustCounter(
      this.manager,
      PostEntity,
      postId,
      'likesCount',
      1,
    );
  }

  async decrementLikes(postId: PostEntity['id']) {
    await adjustCounter(
      this.manager,
      PostEntity,
      postId,
      'likesCount',
      -1,
    );
  }
}

export const PostRepositoryProvider = {
  provide: PostRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(PostEntity)
      .extend(prototypeToObject(PostRepository.prototype));
  },
} satisfies Provider;
