import type React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from 'src/components/ui/carousel/Carousel.tsx';
import { getImageByVariant, getImageUrl } from 'src/lib/utils/image-source.ts';
import type { PhotoDto, PhotoSource, PostDto } from 'src/services/api/types.ts';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import {
  UserAvatar,
  UserBadge,
  UserTag,
} from 'src/components/features/user/UserBadge.tsx';
import { Link } from 'react-router';

function PostLightboxView({
  post,
  initialPhotoId,
  onBackgroundClick,
  setCarouselApi,
}: {
  post: PostDto;
  initialPhotoId?: string;
  onBackgroundClick: () => void;
  setCarouselApi: (api: CarouselApi) => void;
}) {
  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-lightbox-stop]')) {
      return;
    }
    onBackgroundClick();
  };

  const slides = post.photos
    .map((photo) => ({ photo, image: getImageByVariant<PhotoSource>(photo.sourceSet, 'lightbox') }))
    .filter(
      (slide): slide is { photo: PhotoDto; image: PhotoSource } =>
        !!slide.image,
    );
  const startIndex = Math.max(
    0,
    slides.findIndex((slide) => String(slide.photo.id) === initialPhotoId),
  );

  return (
    <div
      className="group relative h-dvh w-full"
      onClick={handleBackgroundClick}
    >
      <Carousel opts={{ duration: 0, startIndex }} setApi={setCarouselApi}>
        <CarouselContent className="ml-0 h-dvh">
          {slides.map(({ photo, image }) => (
            <CarouselItem
              key={photo.id}
              className="flex h-dvh items-center justify-center pl-0"
            >
              <img
                data-lightbox-stop
                src={getImageUrl(image.key)}
                alt=""
                className="block h-full max-h-[1080px] w-auto max-w-full object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          data-lightbox-stop
          variant="ghost"
          size="icon-lg"
          className="left-4"
        />
        <CarouselNext
          data-lightbox-stop
          variant="ghost"
          size="icon-lg"
          className="right-4"
        />
      </Carousel>
      <div
        data-lightbox-stop
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
      >
        <Card
          size="sm"
          className="w-full max-w-lg bg-popover/90 backdrop-blur-sm"
        >
          <CardHeader>
            <CardTitle>
              <UserBadge
                user={post.user}
                render={<Link to={`/users/${post.user.id}`} />}
                className="font-normal"
              >
                <UserAvatar size="sm" />
                <UserTag />
              </UserBadge>
            </CardTitle>
            {post.caption && (
              <CardDescription>
                {post.caption}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export { PostLightboxView };
