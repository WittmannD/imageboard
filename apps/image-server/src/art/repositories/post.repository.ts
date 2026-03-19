import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { type DataSource, type DeepPartial, Repository } from 'typeorm';

import type { PageMetadataDecoded } from '../../common/dto/page.dto.js';
import { PostEntity } from '../entities/post.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';

export interface PostPage extends PageMetadataDecoded<PostEntity> {
  items: PostEntity[];
}

export class PostRepository extends Repository<PostEntity> {
  createDraft(entityLike: DeepPartial<Omit<PostEntity, 'status'>>): PostEntity {
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
