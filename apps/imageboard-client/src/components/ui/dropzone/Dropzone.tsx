import React from 'react';
import {
  type DropzoneInputProps,
  type DropzoneOptions,
  type DropzoneState,
  useDropzone,
} from 'react-dropzone';
import { dropzoneAreaVariants } from 'src/components/ui/dropzone/dropzone-style.ts';
import { cn } from 'src/lib/utils/cn.ts';

function FileDropzoneInput(
  props: React.ComponentPropsWithoutRef<'input'> & DropzoneInputProps,
) {
  return <input {...props} type="file" />;
}

function FileDropzone({
  input,
  className,
  children,
  options,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  input:
    | React.ComponentPropsWithoutRef<'input'>
    | ((
        getInputProps: DropzoneState['getInputProps'],
      ) => React.ReactElement<typeof FileDropzoneInput>);
  options: DropzoneOptions;
  children: (
    state: Omit<DropzoneState, 'getRootProps' | 'getInputProps'>,
  ) => React.ReactNode;
}) {
  const { getRootProps, getInputProps, ...state } = useDropzone(options);
  const dragState = state.isDragActive ? 'dragover' : 'idle';

  return (
    <div
      {...getRootProps({
        className: cn(dropzoneAreaVariants({ state: dragState, className })),
        ...props,
      })}
    >
      {typeof input === 'function' ? (
        input(getInputProps)
      ) : (
        <FileDropzoneInput {...getInputProps(input)} />
      )}
      {children(state)}
    </div>
  );
}

export { FileDropzone, FileDropzoneInput };
