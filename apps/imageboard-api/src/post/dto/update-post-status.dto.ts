import { IsIn } from 'class-validator';

import { PostStatus } from '../enums/post-status.enum.js';

export class UpdatePostStatusDto {
  // Draft is set only on creation; Unpublished deletes the post
  @IsIn([PostStatus.Published, PostStatus.Unpublished])
  status!: PostStatus.Published | PostStatus.Unpublished;
}
