import React from 'react';

function ImageGrid({
  children,
  ...props
}: React.ComponentProps<'div'>) {

  return (
    <div {...props} className="w-full flex flex-row gap-2">
      {children}
    </div>
  );
}

export { ImageGrid };
