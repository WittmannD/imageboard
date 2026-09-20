import { signOutConfirmPage } from '@hdotu1/auth-pages';

import type { OIDCDefinedFeatureConfig } from '../types/config.js';

export default (): OIDCDefinedFeatureConfig<'rpInitiatedLogout'>['logoutSource'] =>
  (context, form) => {
    context.type = 'html';
    context.body = signOutConfirmPage({ host: context.host, form });
  };
