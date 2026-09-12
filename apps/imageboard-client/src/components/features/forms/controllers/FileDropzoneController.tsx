import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';
import { useCallback } from 'react';
import { Field, FieldError, FieldLabel } from 'src/components/ui/field/Field.tsx';
import { FileDropzone, type FileDropzoneProps } from 'src/components/ui/dropzone/Dropzone.tsx';

interface FileDropzoneControllerProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<FileDropzoneProps, 'value' | 'onChange' | 'onBlur' | 'onError' | 'name' | 'id'> {
  name: FieldPath<TFieldValues>;
  label?: string;
}

function FileDropzoneController<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  className,
  ...dropzoneProps
}: FileDropzoneControllerProps<TFieldValues>) {
  const { control, setError, clearErrors } = useFormContext<TFieldValues>();

  const onError = useCallback(
    (error: Error) => {
      setError(name, { type: 'manual', message: error.message });
    },
    [name, setError],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          {label && <FieldLabel htmlFor={`${name}-input`}>{label}</FieldLabel>}
          <FileDropzone
            {...dropzoneProps}
            id={`${name}-input`}
            name={field.name}
            value={field.value ?? []}
            onChange={(files) => {
              clearErrors(name);
              field.onChange(files);
            }}
            onBlur={field.onBlur}
            onError={onError}
          />
          {fieldState.invalid && (
            <FieldError id={`${name}-input-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
}

export default FileDropzoneController;
