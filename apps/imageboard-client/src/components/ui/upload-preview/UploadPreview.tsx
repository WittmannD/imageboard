import React, { useEffect, useState } from 'react';
import { Button } from "src/components/ui/button/Button.tsx";
import { XIcon } from 'lucide-react';
import { cn } from 'src/lib/utils/cn.ts';

function ImagePreview({ file, className, ...props }: React.ComponentProps<'img'> & { file: File }) {
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
      {...props}
      src={url}
      alt={file.name}
      className={cn("w-full max-h-40 min-h-20 object-cover", className)}
    />
  );
}

function UploadPreview({
  className,
  uploads,
  onImageRemove,
  ...props
}: React.ComponentProps<'div'> & { uploads: File[], removable?: boolean, onImageRemove?: (name: string) => void }) {
  const imageRemoveClickHandler = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    event.preventDefault();

    if (event.currentTarget.dataset['name'] && onImageRemove) {
      onImageRemove(event.currentTarget.dataset['name']);
    }
  };

  return (
    <div className={cn('flex flex-row flex-wrap gap-2', className)} {...props}>
      {uploads.map((file) => (
        <div key={`${file.name}-${file.lastModified}`} className="group relative flex-1 min-w-fit">
          <ImagePreview file={file} />
          {onImageRemove && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${file.name}`}
              className="absolute top-0 right-0 invisible group-hover:visible"
              data-name={file.name}
              onClick={imageRemoveClickHandler}
            >
              <XIcon />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export { UploadPreview };
