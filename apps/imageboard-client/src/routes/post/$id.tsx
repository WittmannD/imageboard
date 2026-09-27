import { useSearchParams } from 'react-router';
import { PostLightboxView } from 'src/components/features/post/PostLightboxView.tsx';
import { useCarouselKeydownFallback } from 'src/components/ui/carousel/Carousel.tsx';
import { useGetPostQuery } from 'src/services/api/post/api.ts';

function PostPage({ params }: { params: { id: string } }) {
  const { data: post } = useGetPostQuery(Number(params.id));
  const [searchParams] = useSearchParams();
  const { setApi, handleKeyDownCapture } = useCarouselKeydownFallback();

  if (!post) return <div className="h-dvh w-full bg-black" />;

  return (
    <div onKeyDownCapture={handleKeyDownCapture}>
      <PostLightboxView
        post={post}
        initialPhotoId={searchParams.get('photoId') ?? undefined}
        setCarouselApi={setApi}
      />
    </div>
  );
}

export default PostPage;
