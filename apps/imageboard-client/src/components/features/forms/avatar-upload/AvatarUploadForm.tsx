import FileDropzoneController from 'src/components/features/forms/controllers/FileDropzoneController.tsx';
import { ImageUp } from 'lucide-react';
import { type SubmitHandler, useFormContext } from 'react-hook-form';
import type { avatarUploadFormSchema } from 'src/components/features/forms/controllers/schema.ts';
import z from 'zod';
import { useUploadAvatarMutation } from 'src/services/api/user/api.ts';
import { useCallback } from 'react';

export interface AvatarUploadFormProps {
  onSuccess?: () => void;
}

function AvatarUploadForm({ onSuccess }: AvatarUploadFormProps) {
  const form = useFormContext<z.infer<typeof avatarUploadFormSchema>>();

  const [upload] = useUploadAvatarMutation();

  const onSubmit = useCallback<
    SubmitHandler<z.output<typeof avatarUploadFormSchema>>
  >(
    async (data) => {
      await upload(data.file).unwrap();
      onSuccess?.();
    },
    [upload, onSuccess],
  );

  return (
    <form
      id="create-post-form"
      className="p-4 space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FileDropzoneController
        name="files"
        multiple
        accept={{ 'image/*': [] }}
        placeholder={
          <div className="flex min-h-48 flex-col items-center justify-center gap-2">
            <ImageUp />
            <p>Select an image, or drag and drop it here</p>
          </div>
        }
      />
    </form>
  );
}

export default AvatarUploadForm;
