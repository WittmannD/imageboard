import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ScrollArea } from 'src/components/ui/scroll-area/ScrollArea.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { XIcon } from 'lucide-react';
import React from 'react';
import { cn } from 'src/lib/utils/cn.ts';

function LightboxHeader({ children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="lightbox-header" {...props}>
      {children}
    </div>
  );
}

function LightboxFooter({ children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="lightbox-footer" {...props}>
      {children}
    </div>
  );
}

function LightboxRoot({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

function LightboxPortal({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props}>{children}</DialogPrimitive.Portal>;
}

function LightboxOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="lightbox-overlay"
      className={cn(
        'fixed inset-0 isolate bg-black/10 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

function LightboxContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  const popupRef = React.useRef<HTMLDivElement>(null);

  return (
    <DialogPrimitive.Viewport className="fixed inset-0">
      <ScrollArea className="h-full box-border [data-slot=scroll-area-viewport]:box-border">
        <DialogPrimitive.Popup
          data-slot="lightbox-root"
          className={cn('pointer-events-none relative size-full', className)}
          {...props}
        >
          <div
            ref={popupRef}
            data-slot="lightbox-popup"
            className="pointer-events-auto w-full h-full relative z-50"
          >
            {children}
          </div>
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="lightbox-close"
              render={
                <Button
                  variant="ghost"
                  className="pointer-events-auto fixed top-2 right-2 z-50"
                  size="icon-lg"
                >
                  <XIcon />
                  <span className="sr-only">Close</span>
                </Button>
              }
            />
          )}
        </DialogPrimitive.Popup>
      </ScrollArea>
    </DialogPrimitive.Viewport>
  );
}

export {
  LightboxRoot,
  LightboxOverlay,
  LightboxPortal,
  LightboxContent,
  LightboxHeader,
  LightboxFooter,
};
