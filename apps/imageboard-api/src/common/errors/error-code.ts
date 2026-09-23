/**
 * Machine-readable values for the `errorCode` field of the HTTP error bodies.
 * The client keys its user-facing copy off these, so treat them as part of the
 * API contract.
 */
export const ErrorCode = {
  // generic, derived from the HTTP status when a throw site sets no code
  InvalidInput: 'invalid_input',
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  RateLimited: 'rate_limited',
  ServiceUnavailable: 'service_unavailable',
  InternalError: 'internal_error',

  // auth
  AccessTokenMissing: 'access_token_missing',
  AccessTokenInvalid: 'access_token_invalid',
  AccessTokenExpired: 'access_token_expired',
  EmailNotVerified: 'email_not_verified',

  // uploads
  FileRequired: 'file_required',
  FileTooLarge: 'file_too_large',
  InvalidImageFormat: 'invalid_image_format',
  ImageProcessingFailed: 'image_processing_failed',

  // pagination
  InvalidCursor: 'invalid_cursor',

  // user
  UserNotFound: 'user_not_found',
  UsernameTaken: 'username_taken',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
