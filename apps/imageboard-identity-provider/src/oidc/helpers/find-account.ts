import type { AccountClaims } from 'oidc-provider';

import type { UserEntity } from '../../user/user.entity.js';
import type { UserService } from '../../user/user.service.js';
import claimsConfig from '../config/claims.config.js';
import type { OIDCDefinedConfig } from '../types/config.js';

type UserClaimsMap = Readonly<
  Record<string, keyof UserEntity> & { sub?: never }
>;

const config = claimsConfig();
const userClaimsMap = {
  email: 'email',
  email_verified: 'emailVerified',
  given_name: 'firstName',
  family_name: 'lastName',
} satisfies UserClaimsMap;

/**
 * Extracts and maps claims from the provided scopes based on the user entity and predefined mappings.
 *
 * This function checks the given scopes against a configuration object to determine which claims are
 * associated with each scope. It then maps those claims to the corresponding fields in the user entity
 * using a predefined `userClaimsMap`. Only claims that exist in both the configuration and the mapping
 * will be included in the resulting object.
 *
 * `sub` is always included in the claims, regardless of the scope and equal to the user's ID.
 *
 * @returns An object containing the claims mapped to their corresponding user fields.
 */
const getClaimsFromScopes = (
  user: UserEntity,
  scopes: string[],
): AccountClaims => {
  const picked: Record<
    keyof UserClaimsMap,
    UserEntity[keyof UserEntity]
  > = {};

  for (const scope of scopes) {
    if (!(scope in config)) {
      // Skip scopes that are not configured
      continue;
    }

    const claims = config[scope as keyof typeof config];

    for (const claimKey of claims) {
      if (!(claimKey in userClaimsMap)) {
        // Skip claims that are not mapped to user fields
        continue;
      }

      const userFieldKey = userClaimsMap[claimKey as keyof typeof userClaimsMap];
      picked[claimKey] = user[userFieldKey];
    }
  }

  return { ...picked, sub: user.id };
};

export default (users: UserService): OIDCDefinedConfig<'findAccount'> =>
  async (_context, accountId: string) => {
    const user = await users.findOneById(accountId);

    if (!user) {
      return undefined;
    }

    return {
      accountId: user.id,

      claims: (_use: string, scope: string) => {
        // oidc-provider will exclude fields that are not associated with scope in claims config
        return getClaimsFromScopes(user, scope.split(' '));
      },
    };
  };
