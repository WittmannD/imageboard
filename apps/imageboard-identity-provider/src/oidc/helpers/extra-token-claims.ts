import type { FindAccount } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';

// Should not contain sensitive claims. Standard claims are always exposed (sub, iss, exp, iat, ..., etc.)
const jwtExposedClaims = ['email', 'email_verified', 'preferred_username'];

export default (
    findAccount: FindAccount,
  ): OIDCDefinedConfig<'extraTokenClaims'> =>
  async (ctx, token) => {
    if (token.kind !== 'AccessToken' || !token.resourceServer) {
      return undefined;
    }

    const account = await findAccount(ctx, token.accountId);

    if (!account) {
      return undefined;
    }

    const claims = await account.claims('userinfo', 'email profile', {}, []);
    return Object.fromEntries(
      Object.entries(claims).filter(
        ([key, value]) => jwtExposedClaims.includes(key) && value !== undefined,
      ),
    );
  };
