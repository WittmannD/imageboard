/**
 * Rules every username and password must satisfy. Shared by the identity
 * provider (registration, password reset), the API (username changes) and the
 * client forms, so they always agree. Browser-safe: no Node imports.
 */
export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 20;

/** Latin letters, digits and underscores only. */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
