import { ServiceError } from '../../common/errors/service-error.js';

export class AuthServiceError extends ServiceError {}

/** The identity provider (discovery document or JWKS) can't be reached. */
export class AuthProviderUnavailableError extends AuthServiceError {
  constructor(message = 'Identity provider is unavailable', cause?: unknown) {
    super(message, { cause });
  }
}

export class InvalidAccessTokenError extends AuthServiceError {
  constructor(message = 'Invalid access token', cause?: unknown) {
    super(message, { cause });
  }
}

export class AccessTokenExpiredError extends InvalidAccessTokenError {
  constructor(cause?: unknown) {
    super('Access token has expired', cause);
  }
}

export class EmailNotVerifiedError extends AuthServiceError {
  constructor() {
    super('Email is not verified');
  }
}

/** A federated credential references a user row that no longer exists. */
export class OrphanedFederatedCredentialError extends AuthServiceError {
  constructor() {
    super('Federated credential points to a missing user');
  }
}

/** The user behind a valid token couldn't be created on first sign-in. */
export class UserProvisioningError extends AuthServiceError {
  constructor(cause?: unknown) {
    super('Failed to provision user', { cause });
  }
}
