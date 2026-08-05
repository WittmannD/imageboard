import  { errors } from 'oidc-provider';

import type { OIDCDefinedFeatureConfig } from '../types/config.js';

export default (): OIDCDefinedFeatureConfig<'revocation'>['allowedPolicy'] =>
  (_context, client, token) => {
    if (token.clientId !== client.clientId) {
      if (client.clientAuthMethod === 'none') {
        // do not revoke but respond as success to disallow guessing valid tokens
        return false;
      }
      throw new errors.InvalidRequest(
        'client is not authorized to revoke the presented token',
      );
    }
    return true;
  };
