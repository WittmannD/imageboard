export interface ServiceErrorOptions {
  cause?: unknown;
}

/**
 * Base class for every error a service throws on purpose. Services never
 * throw HTTP exceptions: controllers map these to them in their error
 * filters (see ServiceErrorFilter). Anything that doesn't extend
 * this is an unexpected failure and ends up as a 500.
 */
export abstract class ServiceError extends Error {
  constructor(message?: string, options?: ServiceErrorOptions) {
    super(message, options);

    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
