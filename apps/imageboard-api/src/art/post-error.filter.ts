import { BadRequestException, NotFoundException } from '@nestjs/common';

import { InvalidCursorError } from '../common/errors/common-errors.js';
import { ErrorCode } from '../common/errors/error-code.js';
import { httpError, mapping } from '../common/errors/error-mapping.js';
import { ServiceErrorFilter } from '../common/filters/service-error.filter.js';
import { PostNotFoundError } from './errors/post-service-error.js';

// Gallery errors (InvalidImageError, GalleryLayoutError, ImageProcessingError)
// happen after the response is sent and are handled inside PostService
export class PostErrorFilter extends ServiceErrorFilter {
  protected readonly mappings = [
    mapping(InvalidCursorError, (e) =>
      httpError(BadRequestException, ErrorCode.InvalidCursor, e.message),
    ),
    mapping(PostNotFoundError, (e) =>
      httpError(NotFoundException, ErrorCode.PostNotFound, e.message),
    ),
  ];
}
