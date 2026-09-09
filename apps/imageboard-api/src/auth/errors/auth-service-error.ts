export class AuthServiceError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = 'AuthServiceError';
    Object.setPrototypeOf(this, AuthServiceError.prototype);
  }
}

export class AuthServiceJWKSError extends AuthServiceError {
  constructor(message?: string) {
    super(message);

    this.name = 'AuthServiceJWKSError';
    Object.setPrototypeOf(this, AuthServiceJWKSError.prototype);
  }
}

export class InvalidAccessToken extends AuthServiceError {}
