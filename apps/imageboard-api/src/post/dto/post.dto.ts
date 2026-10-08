import { Exclude, Type } from 'class-transformer';

import { PostEntity } from '../entities/post.entity.js';
import { MediaDto } from './media.dto.js';

export class PostDto extends PostEntity {
  @Type(() => MediaDto)
  override media!: MediaDto[];

  @Exclude()
  override user!: never;
}
