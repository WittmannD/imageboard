import { TRUSTED_METADATA_PROPERTY } from '../config/extra-client-metadata.config.js';
import type { OIDCDefinedConfig } from '../types/config.js';

export default (): OIDCDefinedConfig<'loadExistingGrant'> =>
  async (context) => {
    const grantId =
      context.oidc.result?.consent?.grantId ??
      (context.oidc.client &&
        context.oidc.session?.grantIdFor(context.oidc.client.clientId));

    if (grantId) {
      return context.oidc.provider.Grant.find(grantId);
    }

    const scope =
      typeof context.oidc.params?.['scope'] === 'string'
        ? context.oidc.params['scope']
        : 'openid';

    console.log('scope', scope);

    // If the client is trusted, grant with all scopes
    if (
      context.oidc.client?.metadata()[TRUSTED_METADATA_PROPERTY] &&
      context.oidc.result?.login
    ) {
      const grant = new context.oidc.provider.Grant({
        accountId: context.oidc.result.login.accountId,
        clientId: context.oidc.client.clientId,
      });
      grant.addOIDCScope(scope);
      await grant.save();
      return grant;
    }

    return undefined;
  };
