import { z } from 'zod';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@hdotu1/config/credentials';

export const usernameSchema = z
  .string()
  .trim()
  .min(1, 'Username is required')
  .min(
    USERNAME_MIN_LENGTH,
    `Username must be at least ${USERNAME_MIN_LENGTH} characters long`,
  )
  .max(
    USERNAME_MAX_LENGTH,
    `Username can't be longer than ${USERNAME_MAX_LENGTH} characters`,
  )
  .regex(
    USERNAME_PATTERN,
    'Username can only contain letters (a-z, A-Z), numbers and underscores (_)',
  );

/** A new password. Not trimmed: spaces are valid password characters. */
export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password can't be longer than ${PASSWORD_MAX_LENGTH} characters`,
  );

export const confirmPasswordSchema = z
  .string()
  .min(1, 'Please confirm your password');

const passwordPair = z.object({
  password: z.string(),
  confirmPassword: z.string().min(1),
});

/**
 * Adds the "passwords don't match" check to a form schema, reported on the
 * confirmation field.
 */
export function withPasswordConfirmation<
  T extends z.ZodType<{ password: string; confirmPassword: string }>,
>(schema: T) {
  return schema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
    // Zod skips object refinements once any field has failed; run this one
    // whenever both passwords are present, so the mismatch shows alongside
    // errors on unrelated fields (e.g. an invalid email).
    when: (payload) => passwordPair.safeParse(payload.value).success,
  });
}
