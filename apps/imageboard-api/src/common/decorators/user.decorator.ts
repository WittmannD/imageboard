import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { UserEntity } from '../../user/entities/user.entity.js';
import type { AuthorizedRequest } from '../types/request.js';

export const User = createParamDecorator(
  (data: keyof UserEntity | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    const user = request.user;

    return data ? user[data] : user;
  },
);
