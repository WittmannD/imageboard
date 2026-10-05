import { IsEnum, IsOptional } from 'class-validator';

import { KeySetQueryDto } from '../../common/dto/key-set-query.dto.js';
import type { PostEntity } from '../entities/post.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';

export class UserPostsQueryDto extends KeySetQueryDto<PostEntity> {
  // anything but Published is only served to the author
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus = PostStatus.Published;
}
