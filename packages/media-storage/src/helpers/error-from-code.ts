import {
  AlreadyExistsError,
  InvalidKeyError,
  NotFoundError,
  PermissionDeniedError,
  StorageError,
} from '../errors/index.js';

export const errorFromCode = (code: string): StorageError => {
  switch (code) {
    case 'EACCES':
      return new PermissionDeniedError('Permission denied');
    case 'EEXIST':
      return new AlreadyExistsError('Object already exists');
    case 'ENOENT':
      return new NotFoundError('Object not found');
    case 'EISDIR':
      return new InvalidKeyError('Invalid storage key');
    default:
      return new StorageError(code);
  }
};
