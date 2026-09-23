import type { HttpException } from '@nestjs/common';

import type { ErrorCode } from './error-code.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorClass<E extends Error> = abstract new (...args: any[]) => E;

type HttpExceptionClass = new (
  objectOrError?: unknown,
  description?: string,
) => HttpException;

/** Pairs an error class with a factory building the HTTP exception it maps to. */
export type ErrorMapping<E extends Error = Error> = readonly [
  ErrorClass<E>,
  (error: E) => HttpException,
];

export function mapping<E extends Error>(
  errorClass: ErrorClass<E>,
  toHttp: (error: E) => HttpException,
): ErrorMapping {
  return [errorClass, toHttp as (error: Error) => HttpException];
}

/**
 * Returns the HTTP exception for the first mapping whose class `error` is an
 * instance of, or undefined when none match. Order mappings from the most to
 * the least specific class.
 */
export function mapError(
  error: unknown,
  mappings: readonly ErrorMapping[],
): HttpException | undefined {
  for (const [errorClass, toHttp] of mappings) {
    if (error instanceof errorClass) {
      return toHttp(error);
    }
  }

  return undefined;
}

/** Builds an HTTP exception whose body carries a machine-readable `errorCode`. */
export function httpError(
  exceptionClass: HttpExceptionClass,
  errorCode: ErrorCode,
  message?: string,
): HttpException {
  // Let Nest build its default body ({ statusCode, message, error }) and add
  // the code on top, so coded and uncoded errors share one shape.
  const body = new exceptionClass(message).getResponse() as object;

  return new exceptionClass({ ...body, errorCode });
}
