import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from '../../auth/auth.service.js';
import { SKIP_EMAIL_VERIFICATION } from '../decorators/skip-email-verification.decorator.js';
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
      throw new UnauthorizedException('Authorization header is missing');
    }

    const { token, type } = parseAuthorizationHeader(authorizationHeader);
    if (!token || type !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid authorization header format. Expected "Bearer <token>"',
      );
    }

    let user;
    try {
      user = await this.authService.validateAccessToken(
        token,
        skipEmailVerification,
      );
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid access token');
    }

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    request.user = user;
    return true;
  }
}
