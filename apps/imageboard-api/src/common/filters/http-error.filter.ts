import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { sendHttpException, sendUnexpectedError } from './error-response.js';

/**
 * Last line of error handling, so every error body carries an `errorCode`.
 * Controller filters (see ServiceErrorFilter) code the service errors they
 * know; this fills in a status-based code for the HTTP exceptions thrown
 * where no code is set (the global ValidationPipe, ThrottlerGuard, multer,
 * unknown routes) and turns any other error into a logged, opaque 500.
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      sendHttpException(res, exception, this.logger);
    } else {
      sendUnexpectedError(res, exception, this.logger);
    }
  }
}
