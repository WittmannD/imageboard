import { publicConfig } from 'src/lib/config.ts';
import z from 'zod';

export const createPostFormSchema = z.object({
  caption: z.string().optional(),
  files: z
    .array(z.file().mime([...publicConfig.post.allowedImageMimeTypes]))
    .max(
      publicConfig.post.maxImagesPerPost,
      `You can only upload up to ${publicConfig.post.maxImagesPerPost} files`,
    ),
});
