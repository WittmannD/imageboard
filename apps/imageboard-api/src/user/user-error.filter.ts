import {
  BadGatewayException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { ErrorCode } from '../common/errors/error-code.js';
import { httpError, mapping } from '../common/errors/error-mapping.js';
import { ServiceErrorFilter } from '../common/filters/service-error.filter.js';
import {
  AvatarProcessingError,
  UsernameTakenError,
  UserNotFoundError,
} from './errors/user-service-error.js';

export class UserErrorFilter extends ServiceErrorFilter {
  protected readonly mappings = [
    mapping(UsernameTakenError, (e) =>
      httpError(ConflictException, ErrorCode.UsernameTaken, e.message),
    ),
    mapping(UserNotFoundError, (e) =>
      httpError(NotFoundException, ErrorCode.UserNotFound, e.message),
    ),
    mapping(AvatarProcessingError, (e) =>
      httpError(BadGatewayException, ErrorCode.ImageProcessingFailed, e.message),
    ),
  ];
}
