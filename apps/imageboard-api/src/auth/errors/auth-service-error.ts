export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'AuthServiceError';
    Object.setPrototypeOf(this, AuthServiceError.prototype);
  }
}

export class EmailIsNotVerifiedError extends AuthServiceError {}
export class MissingClaimsError extends AuthServiceError {}
