import { interactionPolicy } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';

// The stock policy: the `consent` prompt fires whenever the client asks for
// scopes the user hasn't granted yet, or explicitly sends `prompt=consent`
// (which the client does on every authorization - oidc-provider strips the
// offline_access scope, and so never issues a refresh token, without it; see
// check_scope.js).
const policy = interactionPolicy.base();

export default () =>
  ({
    url: (_context, interaction) => `/interactions/${interaction.uid}`,
    policy,
  }) satisfies OIDCDefinedConfig<'interactions'>;
