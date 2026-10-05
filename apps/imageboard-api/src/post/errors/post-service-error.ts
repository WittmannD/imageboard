import { ServiceError } from '../../common/errors/service-error.js';
import type { PostStatus } from '../enums/post-status.enum.js';

export class PostServiceError extends ServiceError {}

/** No published post with the requested id exists. */
export class PostNotFoundError extends PostServiceError {
  constructor(message = 'Post not found') {
    super(message);
  }
}

/** A user other than the author asked for the author's non-published posts. */
export class PostAccessForbiddenError extends PostServiceError {
  constructor(message = 'Only the author can see their unpublished posts') {
    super(message);
  }
}

/** The author asked for a status change the post can't make. */
export class InvalidPostStatusTransitionError extends PostServiceError {
  constructor(from: PostStatus, to: PostStatus, reason?: string) {
    super(reason ?? `Cannot change post status from ${from} to ${to}`);
  }
}

/** An uploaded file couldn't be read as an image (e.g. to get its dimensions). */
export class InvalidImageError extends PostServiceError {
  constructor(cause?: unknown) {
    super('Uploaded file is not a readable image', { cause });
  }
}

/** The layout engine found no gallery layout for the uploaded images. */
export class GalleryLayoutError extends PostServiceError {
  constructor(cause?: unknown) {
    super('Failed to lay out the photo gallery', { cause });
  }
}

/** The image processor failed, timed out or returned nothing for a photo. */
export class ImageProcessingError extends PostServiceError {
  constructor(cause?: unknown) {
    super('Failed to process photo', { cause });
  }
}
