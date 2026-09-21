import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  type HttpException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

import { InteractionErrorCode } from '../errors/interaction-error-code.js';

/**
 * The throttler guard and the global ValidationPipe throw these, so their
 * throw sites aren't ours to add an `errorCode` to. Everything else the
 * controller throws carries its own code and goes through Nest's default
 * handling untouched.
 */
@Catch(ThrottlerException, BadRequestException)
export class InteractionErrorCodeFilter
  implements ExceptionFilter<HttpException>
{
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
        exception instanceof ThrottlerException
          ? InteractionErrorCode.RateLimited
          : InteractionErrorCode.InvalidInput,
    });
  }
}
