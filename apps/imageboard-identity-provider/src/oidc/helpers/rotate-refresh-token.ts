import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'rotateRefreshToken'> => (context) => {
  const { RefreshToken: refreshToken, Client: client } = context.oidc.entities;

  if (!refreshToken || !client) {
    return false;
  }

  // cap the maximum amount of time a refresh token can be
  // rotated for up to 1 year, afterwards its TTL is final
  if (refreshToken.totalLifetime() >= 365.25 * 24 * 60 * 60) {
    return false;
  }
  // rotate non sender-constrained public client refresh tokens
  if (
    client.clientAuthMethod === 'none' &&
    !refreshToken.isSenderConstrained()
  ) {
    return true;
  }
  // rotate if the token is nearing expiration (it's beyond 70% of its lifetime)
  return refreshToken.ttlPercentagePassed() >= 70;
}
