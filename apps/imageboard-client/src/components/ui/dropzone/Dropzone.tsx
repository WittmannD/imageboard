import React, { useCallback, useEffect, useId, useState } from 'react';
import { type Accept, type FileRejection, useDropzone } from 'react-dropzone';
import { FileIcon, ImageUp, XIcon } from 'lucide-react';
import {
  Attachment,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from 'src/components/ui/attachment/Attachment.tsx';
import { dropzoneAreaVariants } from 'src/components/ui/dropzone/dropzone-style.ts';
import { cn } from 'src/lib/utils/cn.ts';

function fileKey(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

function formatRejectionError(rejections: FileRejection[]) {
  const messages = new Set(
    rejections.flatMap((rejection) => rejection.errors.map((error) => error.message)),
  );

  return new Error([...messages].join(' '));
}

/**
 * A component that generates a preview image for a file dropped into a file dropzone.
  */
function FileDropzonePreviewImage({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={file.name}
      className={cn('size-full object-cover', className)}
    />
  );
}

/**
 * Renders a preview of a file in a dropzone component, supporting both image
 * and non-image files, with an optional remove functionality.
 */
function FileDropzonePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove?: (file: File) => void;
}) {
  const isImage = file.type.startsWith('image/');

  return (
    <Attachment orientation="vertical">
      {onRemove && (
        <AttachmentTrigger
          aria-label={`Remove ${file.name}`}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onRemove(file);
          }}
        />
      )}
      <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
        {isImage ? <FileDropzonePreviewImage file={file} /> : <FileIcon />}
        {onRemove && (
          <span className="absolute w-full h-full z-20 flex size-5 items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover/attachment:opacity-100">
            <XIcon className="size-3" />
          </span>
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{file.name}</AttachmentTitle>
      </AttachmentContent>
    </Attachment>
  );
}

/**
 * Renders a preview grid for a collection of files with support for individual file removal.
  */
function FileDropzonePreviewGrid({
  files,
  onRemove,
  className,
}: {
  files: File[];
  onRemove?: (file: File) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {files.map((file) => (
        <FileDropzonePreview key={fileKey(file)} file={file} onRemove={onRemove} />
      ))}
    </div>
  );
}

export interface FileDropzoneProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children' | 'onChange' | 'onError'> {
  value?: File[];
  onChange: (files: File[]) => void;
  onBlur?: () => void;
  onError?: (error: Error) => void;
  /** Whether more than one file can be selected. Defaults to true. */
  multiple?: boolean;
  /** MIME type map accepted by the dropzone, e.g. `{ 'image/*': [] }`. */
  accept?: Accept;
  maxSize?: number;
  minSize?: number;
  /** Only relevant when `multiple` is true. */
  maxFiles?: number;
  disabled?: boolean;
  name?: string;
  id?: string;
  placeholder?: React.ReactNode;
  previewClassName?: string;
}

/**
 * A component that provides a dropzone for file uploads with support for
 * drag-and-drop, file validation, and preview management.
 */
function FileDropzone({
  value = [],
  onChange,
  onBlur,
  onError,
  multiple = true,
  accept,
  maxSize,
  minSize,
  maxFiles,
  disabled,
  name,
  id,
  placeholder,
  className,
  previewClassName,
  ...props
}: FileDropzoneProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length) {
        onError?.(formatRejectionError(rejections));
      }

      if (!accepted.length) return;

      if (!multiple) {
        onChange(accepted.slice(0, 1));
        return;
      }

      const merged = new Map(value.map((file) => [fileKey(file), file]));
      for (const file of accepted) {
        merged.set(fileKey(file), file);
      }

      const next = [...merged.values()];
      onChange(maxFiles ? next.slice(0, maxFiles) : next);
    },
    [multiple, maxFiles, onChange, onError, value],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
    maxSize,
    minSize,
    maxFiles: multiple ? maxFiles : 1,
    disabled,
  });

  const handleRemove = useCallback(
    (file: File) => {
      onChange(value.filter((existing) => existing !== file));
    },
    [onChange, value],
  );

  return (
    <div
      {...getRootProps({
        className: cn(
          dropzoneAreaVariants({ state: isDragActive ? 'dragover' : 'idle' }),
          disabled && 'pointer-events-none opacity-50',
          className,
        ),
        ...props,
      })}
    >
      <input {...getInputProps({ name, id: inputId, onBlur })} />
      {value.length ? (
        <FileDropzonePreviewGrid
          files={value}
          onRemove={disabled ? undefined : handleRemove}
          className={previewClassName}
        />
      ) : (
        (placeholder ?? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2">
            <ImageUp />
            <p>Select an image, or drag and drop it here</p>
          </div>
        ))
      )}
    </div>
  );
}

export { FileDropzone, FileDropzonePreview, FileDropzonePreviewGrid };
