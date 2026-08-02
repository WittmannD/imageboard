import { QueryFailedError } from 'typeorm';

/**
 * Checks whether the error is a PostgreSQL QueryFailedError
 * with the specified SQLSTATE error code.
 */
export function isPostgresError(
  error: unknown,
  code: string,
): error is QueryFailedError {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === code
  );
}

/** 23505 - unique_violation */
export function isUniqueViolation(error: unknown): boolean {
  return isPostgresError(error, '23505');
}

/** 23503 - foreign_key_violation */
export function isForeignKeyViolation(error: unknown): boolean {
  return isPostgresError(error, '23503');
}

/** 23502 - not_null_violation */
export function isNotNullViolation(error: unknown): boolean {
  return isPostgresError(error, '23502');
}

/** 23514 - check_violation */
export function isCheckViolation(error: unknown): boolean {
  return isPostgresError(error, '23514');
}

/** 23P01 - exclusion_violation */
export function isExclusionViolation(error: unknown): boolean {
  return isPostgresError(error, '23P01');
}

/** 22001 - string_data_right_truncation */
export function isStringDataRightTruncation(error: unknown): boolean {
  return isPostgresError(error, '22001');
}

/** 22P02 - invalid_text_representation */
export function isInvalidTextRepresentation(error: unknown): boolean {
  return isPostgresError(error, '22P02');
}

/** 22003 - numeric_value_out_of_range */
export function isNumericValueOutOfRange(error: unknown): boolean {
  return isPostgresError(error, '22003');
}

/** 42804 - datatype_mismatch */
export function isDatatypeMismatch(error: unknown): boolean {
  return isPostgresError(error, '42804');
}

/** 42P01 - undefined_table */
export function isUndefinedTable(error: unknown): boolean {
  return isPostgresError(error, '42P01');
}

/** 42703 - undefined_column */
export function isUndefinedColumn(error: unknown): boolean {
  return isPostgresError(error, '42703');
}

/** 42701 - duplicate_column */
export function isDuplicateColumn(error: unknown): boolean {
  return isPostgresError(error, '42701');
}

/** 42P07 - duplicate_table */
export function isDuplicateTable(error: unknown): boolean {
  return isPostgresError(error, '42P07');
}

/** 42710 - duplicate_object */
export function isDuplicateObject(error: unknown): boolean {
  return isPostgresError(error, '42710');
}

/** 40001 - serialization_failure */
export function isSerializationFailure(error: unknown): boolean {
  return isPostgresError(error, '40001');
}

/** 40P01 - deadlock_detected */
export function isDeadlockDetected(error: unknown): boolean {
  return isPostgresError(error, '40P01');
}

/** 55P03 - lock_not_available */
export function isLockNotAvailable(error: unknown): boolean {
  return isPostgresError(error, '55P03');
}
