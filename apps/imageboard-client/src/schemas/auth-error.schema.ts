import { z } from 'zod';

export const authErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
});

export const base64UrlAuthErrorSchema = z
  .base64url()
  .transform((str, ctx) => {
    try {
      // Decode base64 to string, then parse to standard JSON object
      const decodedStr = Buffer.from(str, 'base64url').toString('utf-8');
      return JSON.parse(decodedStr) as object;
    } catch {
      ctx.addIssue({
        code: 'invalid_type',
        expected: authErrorSchema.def.type,
        message: 'Failed to decode base64 or parse invalid JSON structure',
      });
      return z.NEVER;
    }
  })
  .pipe(authErrorSchema);

export type AuthError = z.infer<typeof authErrorSchema>;
