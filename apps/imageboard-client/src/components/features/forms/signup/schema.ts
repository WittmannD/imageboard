import { z } from 'zod';

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@hdotu1/config/username';

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

export const signUpFormSchema = z
  .object({
    username: usernameSchema,
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Must be at least 8 characters long').max(80),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
