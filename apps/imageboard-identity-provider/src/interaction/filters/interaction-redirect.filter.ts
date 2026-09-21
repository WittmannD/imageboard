import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { buildErrorRedirect } from '../../common/helpers/build-error-redirect.js';

/**
 * For the browser-navigated `GET /interactions/:uid` route: there's no fetch
 * caller to hand a JSON error to, so any failure lands on the client's
 * generic error page instead.
 */
@Catch()
export class InteractionRedirectFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (res.headersSent) {
      return;
    }

    console.log(exception);

    res.redirect(
      buildErrorRedirect(
        this.configService.getOrThrow<string>('INTERACTIONS_BASE_URL'),
        {
          error: 'server_error',
          error_description:
            exception instanceof Error ? exception.message : undefined,
        },
      ),
    );
  }
}
