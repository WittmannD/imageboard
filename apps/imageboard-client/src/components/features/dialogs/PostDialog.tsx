import {
  LightboxContent,
  LightboxFooter,
  LightboxHeader,
  LightboxOverlay,
  LightboxPortal,
  LightboxRoot,
} from 'src/components/features/lightbox/Lightbox.tsx';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from 'src/components/ui/carousel/Carousel.tsx';
import type { PhotoDto } from 'src/services/api/types.ts';
import { useGetPostQuery } from 'src/services/api/post.ts';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'src/components/ui/card/Card.tsx';
import type { DialogComponentProps } from 'src/lib/dialog-manager/registry.tsx';

const getPhotoLightboxImage = (photo: PhotoDto) => {
  return photo.sourceSet.find((source) => source.metadata?.variant === 'lightbox')
}

function PostDialog({
  params,
  open,
  onOpenChange,
  onOpenChangeComplete,
}: DialogComponentProps<{ id: number }>) {
  const { data: post } = useGetPostQuery(params.id);

  if (!post) return null;

  return (
    <LightboxRoot open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <LightboxPortal>
        <LightboxOverlay />
        <LightboxContent>
          <LightboxHeader>
            <Carousel opts={{ duration: 0 }}>
              <CarouselContent>
                {post.photos.map((photo) => {
                  const image = getPhotoLightboxImage(photo);
                  if (!image) {
                    return null;
                  }
                  return (
                    <CarouselItem
                      key={photo.id}
                      className="flex items-center justify-center h-screen"
                    >
                      <img
                        src={`${import.meta.env['VITE_IMAGE_SERVER_URL']}/${image.key}`}
                        alt=""
                        className="block bg-muted/50 max-w-full max-h-full"
                      />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </LightboxHeader>
          <LightboxFooter>
            <Card size="sm" className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>{post.caption}</CardDescription>
                <CardAction>Card Action</CardAction>
              </CardHeader>
              <CardContent>
                <p>Card Content</p>
              </CardContent>
              <CardFooter>
                <p>Card Footer</p>
              </CardFooter>
            </Card>
          </LightboxFooter>
        </LightboxContent>
      </LightboxPortal>
    </LightboxRoot>
  );
}

export default PostDialog;