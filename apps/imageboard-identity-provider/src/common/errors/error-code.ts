/**
 * Machine-readable values for the `errorCode` field of the HTTP error bodies
 * this service returns. The client keys its user-facing copy off these, so
 * treat them as part of the API contract.
 */
export const ErrorCode = {
  InvalidCredentials: 'invalid_credentials',
  UsernameTaken: 'username_taken',
  InvalidInput: 'invalid_input',
  RateLimited: 'rate_limited',
  InvalidResetToken: 'invalid_reset_token',
  InvalidVerificationOTP: 'invalid_verification_otp',
} as const;
