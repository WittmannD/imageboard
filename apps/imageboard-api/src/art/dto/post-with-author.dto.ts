import { Type } from 'class-transformer';

import { PostEntity } from '../entities/post.entity.js';
import { PhotoDto } from './photo.dto.js';
import { PostAuthorDto } from './post-author.dto.js';

export class PostWithAuthorDto extends PostEntity {
  @Type(() => PhotoDto)
  override photos!: PhotoDto[];

  @Type(() => PostAuthorDto)
  override user!: PostAuthorDto;
}
