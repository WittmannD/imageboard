import { Controller, useFormContext } from 'react-hook-form';
import { Field, FieldLabel } from 'src/components/ui/field/Field.tsx';
import { FileDropzone } from 'src/components/ui/dropzone/Dropzone.tsx';
import React, { useCallback } from 'react';

function FileDropzoneController({
  name,
  children,
  label
}: {
  name: string;
  label?: string;
  children: React.ComponentProps<typeof FileDropzone>['children'];
}) {
  const { control, setError } = useFormContext();

  const onError = useCallback((error: Error) => {
    setError(name, error);
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field>
          { label && <FieldLabel htmlFor={`${name}-input`}>{ label }</FieldLabel>}
          <FileDropzone
            options={{
              multiple: true,
              onDrop: (files) => field.onChange([...files]),
              onError,
            }}
            input={{
              name,
              id: `${name}-input`,
              onBlur: field.onBlur,
            }}
          >
            {children}
          </FileDropzone>
        </Field>
      )}
    />
  );
}

export default FileDropzoneController;