import { z } from 'zod';

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'Must be at least 8 characters long').max(80),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
