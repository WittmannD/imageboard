import { QueryFailedError } from 'typeorm';

export function isUniqueViolation(error: Error): boolean {
  // Check if it's a TypeORM QueryFailedError
  if (error instanceof QueryFailedError) {
    // Access the underlying database driver error code
    const driverError = error.driverError;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (driverError?.code === '23505') {
      return true
    }
  }

  return false;
}