import { HttpException, HttpStatus, type Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

import { ErrorCode } from '../errors/error-code.js';

const STATUS_ERROR_CODES: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.InvalidInput,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.Unauthorized,
  [HttpStatus.FORBIDDEN]: ErrorCode.Forbidden,
  [HttpStatus.NOT_FOUND]: ErrorCode.NotFound,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.FileTooLarge,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.InvalidInput,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RateLimited,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.ServiceUnavailable,
};

function fallbackErrorCode(exception: HttpException): ErrorCode {
  if (exception instanceof ThrottlerException) {
    return ErrorCode.RateLimited;
  }

  const status = exception.getStatus();

  return (
    STATUS_ERROR_CODES[status] ??
    (status >= 500 ? ErrorCode.InternalError : ErrorCode.InvalidInput)
  );
}

/**
 * Sends an HTTP exception as Nest's usual body plus an `errorCode`. The
 * exception's own code wins; otherwise one is derived from its type/status.
 */
export function sendHttpException(
  res: Response,
  exception: HttpException,
  logger: Logger,
): void {
  const status = exception.getStatus();
  const response = exception.getResponse();
  const body =
    typeof response === 'string'
      ? { statusCode: status, message: response }
      : response;

  if (status >= 500) {
    logger.error(exception.stack);
  }

  res.status(status).json({
    ...body,
    errorCode:
      (body as { errorCode?: unknown }).errorCode ??
      fallbackErrorCode(exception),
  });
}

/** Logs an unexpected error and answers with an opaque 500, leaking nothing. */
export function sendUnexpectedError(
  res: Response,
  error: unknown,
  logger: Logger,
): void {
  logger.error(error instanceof Error ? error.stack : String(error));

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    errorCode: ErrorCode.InternalError,
  });
}
