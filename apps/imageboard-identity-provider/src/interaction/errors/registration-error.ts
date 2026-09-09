export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'RegistrationError';
    Object.setPrototypeOf(this, RegistrationError.prototype);
  }
}

export class UsernameTakenError extends RegistrationError {
  constructor(message = 'Username is already taken') {
    super(message);

    this.name = 'UsernameTakenError';
    Object.setPrototypeOf(this, UsernameTakenError.prototype);
  }
}
