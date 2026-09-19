import z from 'zod';

export const avatarUploadFormSchema = z.object({
  file: z.file(),
});
