/**
 * Machine-readable values for the `errorCode` field of the HTTP error bodies
 * the interaction endpoints return. The client keys its user-facing copy off
 * these, so treat them as part of the API contract.
 */
export const InteractionErrorCode = {
  InvalidCredentials: 'invalid_credentials',
  UsernameTaken: 'username_taken',
  InvalidInput: 'invalid_input',
  RateLimited: 'rate_limited',
} as const;
