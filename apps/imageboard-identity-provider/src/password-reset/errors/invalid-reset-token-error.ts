export class InvalidResetTokenError extends Error {
  constructor(message = 'The password reset link is invalid or has expired') {
    super(message);

    this.name = 'InvalidResetTokenError';
    Object.setPrototypeOf(this, InvalidResetTokenError.prototype);
  }
}
