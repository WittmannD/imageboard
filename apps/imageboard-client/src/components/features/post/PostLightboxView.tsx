import React, { useCallback, useMemo } from 'react';
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
  CardAction,
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
import LikeButton from '../like-button/LikeButton';

function PostLightboxView({
  post,
  initialPhotoId,
  onBackgroundClick,
  setCarouselApi,
}: {
  post: PostDto;
  initialPhotoId?: string;
  onBackgroundClick?: () => void;
  setCarouselApi: (api: CarouselApi) => void;
}) {
  const handleBackgroundClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-lightbox-stop]')) {
        return;
      }
      onBackgroundClick?.();
    },
    [onBackgroundClick],
  );

  const slides = useMemo(
    () =>
      post.photos
        .map((photo) => ({
          photo,
          image: getImageByVariant<PhotoSource>(photo.sourceSet, 'lightbox'),
        }))
        .filter(
          (slide): slide is { photo: PhotoDto; image: PhotoSource } =>
            !!slide.image,
        ),
    [post.photos],
  );
  const startIndex = useMemo(
    () =>
      Math.max(
        0,
        slides.findIndex((slide) => String(slide.photo.id) === initialPhotoId),
      ),
    [initialPhotoId, slides.length],
  );
  const opts = useMemo(
    () => ({ duration: 0, watchDrag: slides.length > 1, startIndex }),
    [slides.length, startIndex],
  );

  return (
    <div
      className="group relative h-dvh w-full overflow-hidden"
      onClick={handleBackgroundClick}
    >
      <Carousel opts={opts} setApi={setCarouselApi}>
        <CarouselContent className="ml-0 h-dvh">
          {slides.map(({ photo, image }) => (
            <CarouselItem
              key={photo.id}
              className="flex h-dvh items-center justify-center pl-0"
            >
              <img
                data-lightbox-stop
                src={getImageUrl(image.key)}
                loading="eager"
                alt=""
                className="block max-h-full w-auto bg-muted/50 max-w-full object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
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
          </>
        )}
      </Carousel>
      <div
        data-lightbox-stop
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex translate-y-4 justify-center p-4 opacity-0 transition-[opacity,translate] duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100"
      >
        <Card
          size="sm"
          className="w-full max-w-lg bg-popover/90 backdrop-blur-xs"
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
            <CardAction>
              <LikeButton post={post} />
            </CardAction>
            {post.caption && <CardDescription>{post.caption}</CardDescription>}
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export { PostLightboxView };
