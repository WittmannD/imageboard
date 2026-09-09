export class UserServiceError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = 'UserServiceError';
    Object.setPrototypeOf(this, UserServiceError.prototype);
  }
}

export class UsernameTakenError extends UserServiceError {
  constructor(message = 'Username is already taken') {
    super(message);

    this.name = 'UsernameTakenError';
    Object.setPrototypeOf(this, UsernameTakenError.prototype);
  }
}
