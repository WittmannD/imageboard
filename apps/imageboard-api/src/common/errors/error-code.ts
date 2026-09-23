/**
 * Machine-readable values for the `errorCode` field of the HTTP error bodies.
 * The client keys its user-facing copy off these, so treat them as part of the
 * API contract.
 */
export const ErrorCode = {
  InvalidImageFormat: 'invalid_image_format',
} as const;
