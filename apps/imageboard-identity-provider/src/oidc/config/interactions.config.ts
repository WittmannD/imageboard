import { interactionPolicy } from 'oidc-provider';

import type { OIDCDefinedConfig } from '../types/config.js';

// We only serve first-party, statically registered clients (see
// clients.config.ts / TRUSTED_METADATA_PROPERTY), and the client app has no
// consent screen. Clients still need to send `prompt=consent` on the
// authorization request to stop oidc-provider from stripping the
// offline_access scope (see oidc-provider's check_scope.js), and `consent`
// must stay a registered/requestable prompt for that value to be accepted
// (see configuration.js:collectPrompts) - otherwise the request is rejected
// with "unsupported prompt value requested". So keep the `consent` prompt
// registered, but drop only the check that force-requires it whenever it's
// requested: trusted clients are already auto-granted every requested scope
// in load-existing-grant.ts, so the prompt's other checks (missing
// scopes/claims etc.) never trigger it for them anyway.
const policy = interactionPolicy.base();
policy.get('consent')?.checks.remove('consent_prompt');

export default () =>
  ({
    url: (_context, interaction) => `/interactions/${interaction.uid}`,
    policy,
  }) satisfies OIDCDefinedConfig<'interactions'>;
