import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { PostEntity } from '../entities/post.entity.js';
import { MediaDraftDto } from './media-draft.dto.js';

export class PostDraftDto extends PostEntity {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDraftDto)
  override media!: MediaDraftDto[];
}
