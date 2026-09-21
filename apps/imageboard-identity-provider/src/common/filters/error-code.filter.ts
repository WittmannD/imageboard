import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  type HttpException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

import { ErrorCode } from '../errors/error-code.js';

/**
 * The throttler guard and the global ValidationPipe throw these, so their
 * throw sites aren't ours to add an `errorCode` to. Everything else a
 * controller throws carries its own code and goes through Nest's default
 * handling untouched; a BadRequestException that already has one keeps it.
 */
@Catch(ThrottlerException, BadRequestException)
export class ErrorCodeFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const response = exception.getResponse();
    const body =
      typeof response === 'string'
        ? { statusCode: status, message: response }
        : response;

    res.status(status).json({
      ...body,
      errorCode:
        (body as { errorCode?: unknown }).errorCode ??
        (exception instanceof ThrottlerException
          ? ErrorCode.RateLimited
          : ErrorCode.InvalidInput),
    });
  }
}
