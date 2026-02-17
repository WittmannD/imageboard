import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { type DataSource, type DeepPartial, Repository } from 'typeorm';

import { PostEntity } from '../entities/post.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';

export class PostRepository extends Repository<PostEntity> {
  createDraft(entityLike: DeepPartial<Omit<PostEntity, 'status'>>) {
    return this.create({
      ...entityLike,
      status: PostStatus.Draft,
    });
  }
}

export const PostRepositoryProvider = {
  provide: PostRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(PostEntity)
      .extend(PostRepository.prototype);
  },
} as Provider;
