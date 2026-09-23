import { ServiceError } from './service-error.js';

/** The key-set pagination cursor is malformed or references a non-sortable field. */
export class InvalidCursorError extends ServiceError {
  constructor(message = 'Invalid pagination cursor') {
    super(message);
  }
}
