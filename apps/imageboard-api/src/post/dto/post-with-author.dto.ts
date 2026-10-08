import { Type } from 'class-transformer';

import { PostEntity } from '../entities/post.entity.js';
import { MediaDto } from './media.dto.js';
import { PostAuthorDto } from './post-author.dto.js';

export class PostWithAuthorDto extends PostEntity {
  @Type(() => MediaDto)
  override media!: MediaDto[];

  @Type(() => PostAuthorDto)
  override user!: PostAuthorDto;
}
