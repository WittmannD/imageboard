import z from 'zod';

export const createPostFormSchema = z.object({
  caption: z.string().optional(),
  files: z.array(z.file()),
});
