import {
  confirmPasswordSchema,
  passwordSchema,
  usernameSchema,
  withPasswordConfirmation,
} from 'src/components/features/forms/credentials-schema.ts';
import { z } from 'zod';

export const signUpFormSchema = withPasswordConfirmation(
  z.object({
    username: usernameSchema,
    email: z.email('Enter a valid email address'),
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  }),
);
