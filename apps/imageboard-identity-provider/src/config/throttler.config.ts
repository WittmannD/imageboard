import type { ThrottlerModuleOptions } from '@nestjs/throttler';


// General DoS/abuse protection applied to every endpoint that doesn't
// override it with a stricter, endpoint-specific throttle below.
export default (): { throttler: ThrottlerModuleOptions } => ({
  throttler: [
    {
      name: 'default',
      ttl: 60_000, // 1 minute
      limit: 100, // 100 requests/min per IP
    },
  ],
});

// This is an identity provider: login/registration/OTP endpoints are the
// primary credential-stuffing and enumeration attack surface, so they get
// much tighter, endpoint-specific limits than the general default above.

// Brute-forcing a password against a known email.
export const LOGIN_THROTTLE = { default: { ttl: 60_000, limit: 5 } }; // 5 attempts/min per IP

// Mass/automated account creation.
export const REGISTRATION_THROTTLE = { default: { ttl: 60 * 60_000, limit: 10 } }; // 10 attempts/hour per IP

// Sending the verification OTP triggers an email - also guards against email-bombing a victim address.
export const EMAIL_VERIFICATION_THROTTLE = { default: { ttl: 60_000, limit: 3 } }; // 3 attempts/min per IP

// Guessing a 6-digit OTP; kept tight enough to make brute-forcing infeasible before the OTP session expires.
export const VERIFICATION_COMPLETE_THROTTLE = { default: { ttl: 60_000, limit: 5 } }; // 5 attempts/min per IP

// oidc-provider's own routes (authorize, token, jwks, etc), mounted behind a single catch-all controller.
export const OIDC_THROTTLE = { default: { ttl: 60_000, limit: 60 } }; // 60 requests/min per IP
