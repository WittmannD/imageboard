import type { FindAccount } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';

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

    const { email, email_verified, name } = await account.claims(
      'userinfo',
      'email profile',
      {},
      [],
    );
    return { email, email_verified, name };
  };
