import { publicConfig } from 'src/lib/config.ts';
import z from 'zod';

export const avatarUploadFormSchema = z.object({
  file: z.array(
    z
      .file()
      .min(1)
      .max(publicConfig.user.avatarSizeLimitBytes)
      .mime([...publicConfig.user.allowedAvatarMimeTypes]),
  ),
});
