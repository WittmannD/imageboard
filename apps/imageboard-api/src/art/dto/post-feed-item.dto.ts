import { PostWithAuthorDto } from './post-with-author.dto.js';

export class PostFeedItemDto extends PostWithAuthorDto {
  /** Whether the requesting user has liked the post; false for anonymous requests. */
  likedByMe!: boolean;
}
