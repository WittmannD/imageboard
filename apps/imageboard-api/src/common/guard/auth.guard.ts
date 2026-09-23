import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from '../../auth/auth.service.js';
import { SKIP_EMAIL_VERIFICATION } from '../decorators/skip-email-verification.decorator.js';
import { ErrorCode } from '../errors/error-code.js';
import { httpError } from '../errors/error-mapping.js';
import type { AuthorizedRequest } from '../types/request.js';

function parseAuthorizationHeader(header: string): { type?: string, token?: string } {
  const [type, token] = header.split(' ');
  return {
    type,
    token
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check route metadata
    const skipEmailVerification = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMAIL_VERIFICATION,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    const authorizationHeader = request.header('Authorization');
    if (!authorizationHeader) {
      throw httpError(
        UnauthorizedException,
        ErrorCode.AccessTokenMissing,
        'Authorization header is missing',
      );
    }

    const { token, type } = parseAuthorizationHeader(authorizationHeader);
    if (!token || type !== 'Bearer') {
      throw httpError(
        UnauthorizedException,
        ErrorCode.AccessTokenInvalid,
        'Invalid authorization header format. Expected "Bearer <token>"',
      );
    }

    // AuthService errors propagate to the controller's ServiceErrorFilter
    const user = await this.authService.validateAccessToken(
      token,
      skipEmailVerification,
    );

    if (!user) {
      throw httpError(
        UnauthorizedException,
        ErrorCode.AccessTokenInvalid,
        'Invalid access token',
      );
    }

    request.user = user;
    return true;
  }
}
