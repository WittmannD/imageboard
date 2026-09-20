import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { buildErrorRedirect } from '../../common/helpers/build-error-redirect.js';
import { UsernameTakenError } from '../errors/registration-error.js';
import { InvalidCredentialsError } from '../errors/login-error.js';

type FriendlyErrorCode =
  | 'invalid_credentials'
  | 'username_taken'
  | 'invalid_input'
  | 'rate_limited';

function toFriendlyErrorCode(exception: unknown): FriendlyErrorCode | null {
  if (exception instanceof InvalidCredentialsError) {
    return 'invalid_credentials';
  }
  if (exception instanceof UsernameTakenError) {
    return 'username_taken';
  }
  if (exception instanceof ThrottlerException) {
    return 'rate_limited';
  }
  // The global ValidationPipe throws this for malformed request bodies -
  // bypassing HTML5 form constraints, not a real infrastructure failure.
  if (exception instanceof BadRequestException) {
    return 'invalid_input';
  }
  return null;
}

/**
 * `login`/`registration` are submitted as plain HTML form posts, not fetch
 * calls the client can intercept - a thrown exception would otherwise reach
 * the browser as Nest's raw JSON error body. Known, recoverable failures
 * (wrong password, taken username, bad input) redirect back to the same
 * interaction so the user can fix the form and retry; anything else falls
 * back to the generic error page, since retrying that form won't help.
 */
@Catch()
export class InteractionExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    if (res.headersSent) {
      return;
    }

    const interactionsBaseUrl = this.configService.getOrThrow<string>(
      'INTERACTIONS_BASE_URL',
    );
    const uidParam = req.params['uid'];
    const uid = typeof uidParam === 'string' ? uidParam : undefined;
    const prompt = req.path.endsWith('/login')
      ? 'login'
      : req.path.endsWith('/registration')
        ? 'registration'
        : null;
    const code = toFriendlyErrorCode(exception);

    if (uid && prompt && code) {
      const params = new URLSearchParams({ uid, error: code });
      const body = req.body as Record<string, unknown> | undefined;

      // Never echo the password back - only fields safe to land in a URL.
      if (typeof body?.['email'] === 'string') {
        params.set('email', body['email']);
      }
      if (prompt === 'registration' && typeof body?.['username'] === 'string') {
        params.set('username', body['username']);
      }

      res.redirect(new URL(`${prompt}?${params}`, interactionsBaseUrl).href);
      return;
    }

    res.redirect(
      buildErrorRedirect(interactionsBaseUrl, {
        error: 'server_error',
        error_description:
          exception instanceof Error ? exception.message : undefined,
      }),
    );
  }
}
