import { useCarouselKeydownFallback } from 'src/components/ui/carousel/Carousel.tsx';
import { useGetPostQuery } from 'src/services/api/post.ts';
import type { DialogComponentProps } from 'src/lib/dialog-manager/registry.tsx';
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
} from 'src/components/ui/dialog/Dialog.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { XIcon } from 'lucide-react';
import { PostLightboxView } from 'src/components/features/post/PostLightboxView.tsx';

function PostDialog({
  params,
  open,
  onOpenChange,
  onOpenChangeComplete,
}: DialogComponentProps<{ id: string, photoId: string }>) {
  const { data: post } = useGetPostQuery(Number(params.id));
  const { setApi, handleKeyDownCapture } = useCarouselKeydownFallback();

  if (!post) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogPopup
          size="full"
          className="overflow-hidden p-0 bg-transparent"
          onKeyDownCapture={handleKeyDownCapture}
        >
          <PostLightboxView
            post={post}
            initialPhotoId={params.photoId}
            onBackgroundClick={() => onOpenChange(false)}
            setCarouselApi={setApi}
          />
          <DialogClose
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2 z-50 text-white hover:bg-white/10 hover:text-white"
                size="icon-lg"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

export default PostDialog;
