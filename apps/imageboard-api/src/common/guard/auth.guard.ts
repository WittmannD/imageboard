import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../../auth/auth.service.js';
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
    private readonly authService: AuthService
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    const authorizationHeader = request.header('Authorization');
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const { token, type } = parseAuthorizationHeader(authorizationHeader);
    if (!token || type !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format. Expected "Bearer <token>"');
    }

    const user = await this.authService.validateAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    request.user = user;
    return true;
  }
}
