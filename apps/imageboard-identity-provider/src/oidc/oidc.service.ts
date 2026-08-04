import { Injectable } from '@nestjs/common';
import type { AccountClaims } from 'oidc-provider';

import type { UserEntity } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';
import { oidcConfiguration } from './oidc.config.js';

@Injectable()
export class OidcService {
  constructor(private readonly userService: UserService) {}

  private claimsFromScope(user: UserEntity, scopes: string[]): AccountClaims {
    const fieldsMap = user.getOidcFieldsMap();

    if (
      !oidcConfiguration.claims ||
      scopes.length === 0 ||
      Object.keys(fieldsMap).length === 0
    ) {
      return {
        sub: user.id,
      };
    }

    const picked: Record<string, UserEntity[keyof UserEntity]> = {};

    for (const scope of scopes) {
      if (!oidcConfiguration.claims[scope]) {
        continue;
      }

      for (const key of oidcConfiguration.claims[scope]) {
        const userFieldKey = fieldsMap[key] as keyof UserEntity | undefined;

        if (!userFieldKey) {
          continue;
        }

        if (user[userFieldKey]) picked[key] = user[userFieldKey];
      }
    }

    return { ...picked, sub: user.id };
  }

  async findAccount(accountId: string) {
    const user = await this.userService.findOneById(accountId);

    console.log('findAccount', accountId, user, );

    if (!user) {
      return undefined;
    }

    return {
      accountId: user.id,

      claims: (_use: string, scope: string) => {
        return this.claimsFromScope(user, scope.split(' '));
      },
    };
  }
}
