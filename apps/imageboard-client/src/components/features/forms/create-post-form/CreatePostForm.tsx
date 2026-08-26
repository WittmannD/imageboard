import { z } from 'zod';
import { Controller, useFormContext, type SubmitHandler } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from 'src/components/ui/field/Field.tsx';
import { Textarea } from 'src/components/ui/textarea/Textarea.tsx';
import { ImageUp } from 'lucide-react';
import { useCallback } from 'react';
import FileDropzoneController from 'src/components/features/forms/controllers/FileDropzoneController.tsx';
import { UploadPreview } from 'src/components/ui/upload-preview/UploadPreview.tsx';
import { createPostFormSchema } from 'src/components/features/forms/create-post-form/schema.ts';
import { clsx } from 'clsx';
import { useCreatePostMutation } from 'src/services/api/post.ts';
import { useDialog } from 'src/lib/dialog/hooks/useDialog.ts';

export default function CreatePostForm() {
  const dialog = useDialog();
  const form = useFormContext<z.infer<typeof createPostFormSchema>>();
  const filesValue = form.watch('files');

  const [createPost] = useCreatePostMutation();

  const onSubmit = useCallback<
    SubmitHandler<z.output<typeof createPostFormSchema>>
  >(
    async (data) => {
      await createPost({
        caption: data.caption,
        files: data.files,
      }).unwrap();
      dialog.hide();
    },
    [createPost],
  );

  const onImageRemove = useCallback(
    (name: string) => {
      form.setValue(
        'files',
        filesValue.filter((file) => file.name !== name),
        {
          shouldValidate: true,
          shouldDirty: true,
        },
      );
    },
    [filesValue],
  );

  return (
    <form
      id="create-post-form"
      className="p-4 space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FileDropzoneController name="files">
        {() => (
          <div>
            {filesValue.length ? (
              <UploadPreview
                className="flex-1"
                uploads={filesValue}
                onImageRemove={onImageRemove}
              />
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2">
                <ImageUp />
                <p>Select an image, or drag and drop it here</p>
              </div>
            )}
          </div>
        )}
      </FileDropzoneController>
      <Controller
        name="caption"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className={clsx({ hidden: !filesValue.length })}
          >
            <FieldLabel htmlFor="create-post-form-caption">Caption</FieldLabel>
            <Textarea
              {...field}
              id="create-post-form-caption"
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid
                  ? 'create-post-form-caption-error'
                  : undefined
              }
            />
            {fieldState.invalid && (
              <FieldError
                id="create-post-form-caption-error"
                errors={[fieldState.error]}
              />
            )}
          </Field>
        )}
      />
    </form>
  );
}
