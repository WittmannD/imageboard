import { type ExecutionContext, Injectable } from '@nestjs/common';

import type { AuthorizedRequest } from '../types/request.js';
import { AuthGuard } from './auth.guard.js';

/**
 * Lets anonymous requests through with no `request.user`, but authenticates
 * requests that send an Authorization header exactly like AuthGuard, so a bad
 * or expired token still answers 401 instead of silently going anonymous.
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    if (!request.header('Authorization')) {
      return true;
    }

    return await super.canActivate(context);
  }
}
