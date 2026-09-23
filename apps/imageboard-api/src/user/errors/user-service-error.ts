import { ServiceError } from '../../common/errors/service-error.js';

export class UserServiceError extends ServiceError {}

export class UsernameTakenError extends UserServiceError {
  constructor(message = 'Username is already taken') {
    super(message);
  }
}

export class UserNotFoundError extends UserServiceError {
  constructor(message = 'User not found') {
    super(message);
  }
}

/** Every generated fallback username collided while creating a user. */
export class UsernameGenerationError extends UserServiceError {
  constructor(message = 'Failed to generate a unique username') {
    super(message);
  }
}

/** The image processor failed, timed out or returned nothing for an avatar. */
export class AvatarProcessingError extends UserServiceError {
  constructor(cause?: unknown) {
    super('Failed to process avatar image', { cause });
  }
}
