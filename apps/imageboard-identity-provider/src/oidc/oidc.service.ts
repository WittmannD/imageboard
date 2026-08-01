import { Injectable } from '@nestjs/common';
import type { AccountClaims } from 'oidc-provider';
import { UserService } from '../user/user.service.js';
import { oidcConfiguration } from './oidc.config.js';
import type { UserEntity } from '../user/user.entity.js';

@Injectable()
export class OidcService {
  constructor(private readonly userService: UserService) {}

  private claimsFromScope(user: UserEntity, scopes: string[]): AccountClaims {
    const fieldsMap = user.getOidcFieldsMap();

    if (
      !oidcConfiguration.scopes ||
      !oidcConfiguration.claims ||
      scopes.length === 0 ||
      Object.keys(fieldsMap).length === 0
    ) {
      return {
        sub: user.id,
      };
    }

    const picked: Record<string, UserEntity[keyof UserEntity]> = {};

    for (const scope of oidcConfiguration.scopes) {
      if (!oidcConfiguration.claims[scope] || !scopes.includes(scope)) {
        continue;
      }

      for (const key of oidcConfiguration.claims[scope]) {
        const userFieldKey = fieldsMap[key];
        picked[key] = user[userFieldKey];
      }
    }

    return { sub: user.id, ...picked };
  }

  async findAccount(accountId: string) {
    const user = await this.userService.findOne(accountId);

    console.log('findAccount', accountId);

    if (!user) {
      return undefined;
    }

    return {
      accountId: user.id,

      claims: async (_use: string, scope: string): Promise<AccountClaims> =>
        this.claimsFromScope(user, scope.split(' ')),
    };
  }
}
