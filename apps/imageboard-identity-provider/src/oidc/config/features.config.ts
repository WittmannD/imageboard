import resourceIndicatorsConfig from '../helpers/resource-indicators.js';
import revocationFeaturePolicy from '../helpers/revocation-feature-policy.js';
import type { OIDCDefinedConfig } from '../types/config.js';

export default () => ({
  devInteractions: { enabled: false },

  // imageboard-api is the only resource server behind this issuer. Access
  // tokens are signed JWTs scoped to it by default (see
  // helpers/resource-indicators.ts), so it can verify them against this
  // issuer's JWKS on its own - no introspection round-trip needed.
  resourceIndicators: { enabled: true, ...resourceIndicatorsConfig() },
  // Disable the backchannel logout feature. No need for logout tokens for now
  backchannelLogout: { enabled: false },
  // No login approves
  ciba: { enabled: false, deliveryModes: ['poll'] },
  // No client authorization
  clientCredentials: { enabled: false },
  // We are using JWT tokens and validating them on place, no need for introspection
  introspection: { enabled: false },
  jwtIntrospection: { enabled: false },
  // We use only predefined clients, no dynamic registration
  registration: { enabled: false },
  registrationManagement: { enabled: false },
  // There are better alternatives (see introspection or backchannel logout),
  // but it's the simplest for mvp
  revocation: { enabled: true, allowedPolicy: revocationFeaturePolicy() },
  rpInitiatedLogout: {
    enabled: true,
    // TODO: implement logout html sources
    // logoutSource: () => {},
    // postLogoutSuccessSource: () => {},
  },
  // Get user info as a regular JSON object
  userinfo: { enabled: true },
  jwtUserinfo: { enabled: false },
} satisfies OIDCDefinedConfig<'features'>);
