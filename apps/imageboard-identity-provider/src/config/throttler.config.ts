import type { ThrottlerModuleOptions } from '@nestjs/throttler';

import { getConfig } from '@hdotu1/config';

// The limits, and the reasoning behind each of them, live in the shared
// configuration (packages/config/src/profiles/base.ts).
const { throttle } = getConfig().identityProvider;

export default (): { throttler: ThrottlerModuleOptions } => ({
  throttler: [
    {
      name: 'default',
      ...throttle.default,
      skipIf: () => !getConfig().throttle.enabled,
    },
  ],
});

export const LOGIN_THROTTLE = { default: throttle.login };
export const REGISTRATION_THROTTLE = { default: throttle.registration };
export const EMAIL_VERIFICATION_THROTTLE = { default: throttle.emailVerification };
export const VERIFICATION_COMPLETE_THROTTLE = { default: throttle.verificationComplete };
export const PASSWORD_RESET_REQUEST_THROTTLE = { default: throttle.passwordResetRequest };
export const PASSWORD_RESET_COMPLETE_THROTTLE = { default: throttle.passwordResetComplete };
export const OIDC_THROTTLE = { default: throttle.oidc };
export const CONSENT_THROTTLE = { default: throttle.consent };
