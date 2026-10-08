import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from 'src/components/ui/carousel/Carousel.tsx';
import { getLightboxSource, getMediaUrl } from 'src/lib/utils/image-source.ts';
import type { MediaDto, MediaSource, PostDto } from 'src/services/api/types.ts';
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
import { formatPostDate } from 'src/lib/utils/date.ts';
import Zoom from 'src/components/ui/zoom/Zoom.tsx';
import { PostActionMenu } from 'src/components/features/post/PostActionMenu.tsx';

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
      post.media
        .map((photo) => ({
          photo,
          image: getLightboxSource(photo),
        }))
        .filter(
          (slide): slide is { photo: MediaDto; image: MediaSource } =>
            !!slide.image,
        ),
    [post.media],
  );
  const startIndex = useMemo(
    () =>
      Math.max(
        0,
        slides.findIndex((slide) => String(slide.photo.id) === initialPhotoId),
      ),
    [initialPhotoId, slides.length],
  );
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  // Read by watchDrag at the start of each drag; a ref, so zooming does not
  // change opts and re-initialise the carousel.
  const isZoomedInRef = useRef(false);

  const handleSetApi = useCallback(
    (carouselApi: CarouselApi) => {
      setApi(carouselApi);
      setCarouselApi(carouselApi);
    },
    [setCarouselApi],
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      // Each slide's Zoom resets itself when this changes.
      setSelectedIndex(api.selectedScrollSnap());
      isZoomedInRef.current = false;
    };

    onSelect();
    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const handleZoomChange = useCallback((multiplier: number) => {
    isZoomedInRef.current = multiplier > 1;
  }, []);

  const opts = useMemo(
    () => ({
      duration: 0,
      // A drag on a zoomed-in image pans it instead of swiping.
      watchDrag: slides.length > 1 ? () => !isZoomedInRef.current : false,
      startIndex,
    }),
    [slides.length, startIndex],
  );

  return (
    <div
      className="group relative h-dvh w-full overflow-hidden"
      onClick={handleBackgroundClick}
    >
      <Carousel opts={opts} setApi={handleSetApi}>
        <CarouselContent className="ml-0 h-dvh">
          {slides.map(({ photo, image }, index) => (
            <CarouselItem
              key={photo.id}
              className="flex h-dvh items-center justify-center pl-0"
            >
              <Zoom
                toggleOn={null}
                resetKey={selectedIndex}
                onZoomChange={
                  index === selectedIndex ? handleZoomChange : undefined
                }
                wheelStartsZoom={false}
                className="h-full w-full"
              >
                {({ toggle }) => (
                  <img
                    data-lightbox-stop
                    src={getMediaUrl(photo, image.key)}
                    onClick={toggle}
                    loading="eager"
                    alt=""
                    className="block max-h-full max-w-full bg-muted/50 object-contain"
                  />
                )}
              </Zoom>
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
            <CardTitle className="font-normal flex items-center">
              <UserBadge
                user={post.user}
                render={<Link to={`/users/${post.user.id}`} />}
              >
                <UserAvatar size="sm" />
                <UserTag />
              </UserBadge>
              <span className="ml-2 text-sm text-muted-foreground/50 tabular-nums">
                {formatPostDate(post.createdAt)}
              </span>
            </CardTitle>
            <CardAction>
              <LikeButton post={post} />
              <PostActionMenu post={post} />
            </CardAction>
            {post.caption && <CardDescription>{post.caption}</CardDescription>}
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export { PostLightboxView };
