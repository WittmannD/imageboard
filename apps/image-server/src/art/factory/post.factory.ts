import { plainToInstance } from 'class-transformer';

import { PostDraftDto } from '../dto/post-draft.dto.js';
import type { PostEntity } from '../entities/post.entity.js';

export class PostFactory {
  createPostDraftDtoFromEntity(postEntity: PostEntity): PostDraftDto {
    return plainToInstance(PostDraftDto, postEntity);
  }
}
