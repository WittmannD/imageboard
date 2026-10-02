/**
 * Rules every username must satisfy. Shared by the identity provider
 * (registration), the API (username changes) and the client forms, so the
 * three always agree. Browser-safe: no Node imports.
 */
export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 20;

/** Latin letters, digits and underscores only. */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
