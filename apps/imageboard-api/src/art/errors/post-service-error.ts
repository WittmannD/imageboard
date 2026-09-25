import { ServiceError } from '../../common/errors/service-error.js';

export class PostServiceError extends ServiceError {}

/** No published post with the requested id exists. */
export class PostNotFoundError extends PostServiceError {
  constructor(message = 'Post not found') {
    super(message);
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
