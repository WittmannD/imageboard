import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { PostEntity } from '../entities/post.entity.js';
import { PhotoDraftDto } from './photo-draft.dto.js';

export class PostDraftDto extends PostEntity {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoDraftDto)
  override photos!: PhotoDraftDto[];
}
