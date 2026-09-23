import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { AUTH_ERROR_MAPPINGS } from '../../auth/auth-error.mappings.js';
import { type ErrorMapping, mapError } from '../errors/error-mapping.js';
import { ServiceError } from '../errors/service-error.js';
import { sendHttpException, sendUnexpectedError } from './error-response.js';

/**
 * Translates the service errors thrown while handling a controller's routes
 * into coded HTTP responses. Each controller extends this with its own
 * mappings and applies it with @UseFilters. Filters see everything from
 * guards to the handler, so the AuthService errors AuthGuard lets through are
 * mapped here for every controller. A ServiceError nobody mapped is a bug in
 * the mappings and answers 500; other errors go on to HttpErrorFilter.
 */
@Catch(ServiceError)
export abstract class ServiceErrorFilter implements ExceptionFilter<ServiceError> {
  private readonly logger = new Logger(ServiceErrorFilter.name);

  protected abstract readonly mappings: readonly ErrorMapping[];

  catch(error: ServiceError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const exception = mapError(error, [...this.mappings, ...AUTH_ERROR_MAPPINGS]);

    if (exception) {
      sendHttpException(res, exception, this.logger);
    } else {
      sendUnexpectedError(res, error, this.logger);
    }
  }
}
