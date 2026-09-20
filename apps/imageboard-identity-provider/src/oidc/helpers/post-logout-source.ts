import { signOutSuccessPage } from '@hdotu1/auth-pages';

import type { OIDCDefinedFeatureConfig } from '../types/config.js';

export default (): OIDCDefinedFeatureConfig<'rpInitiatedLogout'>['postLogoutSuccessSource'] =>
  (context) => {
    context.type = 'html';
    context.body = signOutSuccessPage({
      clientName: context.oidc.client?.clientName ?? context.oidc.client?.clientId,
    });
  };
