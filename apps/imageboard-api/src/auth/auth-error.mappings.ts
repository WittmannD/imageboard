import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { ErrorCode } from '../common/errors/error-code.js';
import {
  type ErrorMapping,
  httpError,
  mapping,
} from '../common/errors/error-mapping.js';
import {
  AccessTokenExpiredError,
  AuthProviderUnavailableError,
  EmailNotVerifiedError,
  InvalidAccessTokenError,
} from './errors/auth-service-error.js';

// AuthService errors that AuthGuard lets through; ServiceErrorFilter applies
// these for every controller
export const AUTH_ERROR_MAPPINGS: readonly ErrorMapping[] = [
  mapping(AccessTokenExpiredError, (e) =>
    httpError(UnauthorizedException, ErrorCode.AccessTokenExpired, e.message),
  ),
  mapping(InvalidAccessTokenError, (e) =>
    httpError(UnauthorizedException, ErrorCode.AccessTokenInvalid, e.message),
  ),
  mapping(EmailNotVerifiedError, (e) =>
    httpError(UnauthorizedException, ErrorCode.EmailNotVerified, e.message),
  ),
  mapping(AuthProviderUnavailableError, () =>
    httpError(
      ServiceUnavailableException,
      ErrorCode.ServiceUnavailable,
      'Authentication is temporarily unavailable',
    ),
  ),
];
