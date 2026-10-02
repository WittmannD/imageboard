import { z } from 'zod';

import { PASSWORD_MAX_LENGTH } from '@hdotu1/config/credentials';

export const loginFormSchema = z.object({
  email: z.email('Enter a valid email address'),
  // Only an upper bound: existing passwords must keep working whatever the
  // current minimum is.
  password: z
    .string()
    .min(1, 'Password is required')
    .max(
      PASSWORD_MAX_LENGTH,
      `Password can't be longer than ${PASSWORD_MAX_LENGTH} characters`,
    ),
});
