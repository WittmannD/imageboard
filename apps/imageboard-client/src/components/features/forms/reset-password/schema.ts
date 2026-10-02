import {
  confirmPasswordSchema,
  passwordSchema,
  withPasswordConfirmation,
} from 'src/components/features/forms/credentials-schema.ts';
import { z } from 'zod';

export const resetPasswordFormSchema = withPasswordConfirmation(
  z.object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  }),
);
