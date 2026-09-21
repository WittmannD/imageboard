export class InvalidOtpError extends Error {
  constructor(message = 'The one-time password is invalid or has expired') {
    super(message);

    this.name = 'InvalidOtpError';
    Object.setPrototypeOf(this, InvalidOtpError.prototype);
  }
}
