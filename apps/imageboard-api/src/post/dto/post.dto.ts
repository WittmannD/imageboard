import { Type } from 'class-transformer';

import { PostEntity } from '../entities/post.entity.js';
import { PhotoDto } from './photo.dto.js';

export class PostDto extends PostEntity {
  @Type(() => PhotoDto)
  override photos!: PhotoDto[];
}
