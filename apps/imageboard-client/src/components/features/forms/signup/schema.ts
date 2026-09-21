import { z } from 'zod';

export const signUpFormSchema = z
  .object({
    username: z.string().min(1, 'Username is required').max(20),
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Must be at least 8 characters long').max(80),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
