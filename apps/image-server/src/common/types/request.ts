import type { Request } from 'express';

import type { UserEntity } from '../../user/entities/user.entity.js';

export type AuthorizedRequest = Request & { user: UserEntity };
