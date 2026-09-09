import { Link, useNavigate, useSearchParams } from 'react-router';
import { XIcon } from 'lucide-react';
import { Button } from 'src/components/ui/button/Button.tsx';
import { PostLightboxView } from 'src/components/features/post/PostLightboxView.tsx';
import { useCarouselKeydownFallback } from 'src/components/ui/carousel/Carousel.tsx';
import { useGetPostQuery } from 'src/services/api/post.ts';

function PostPage({ params }: { params: { id: string } }) {
  const { data: post } = useGetPostQuery(Number(params.id));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setApi, handleKeyDownCapture } = useCarouselKeydownFallback();

  if (!post) return <div className="h-dvh w-full bg-black" />;

  return (
    <div onKeyDownCapture={handleKeyDownCapture}>
      <PostLightboxView
        post={post}
        initialPhotoId={searchParams.get('photoId') ?? undefined}
        onBackgroundClick={() => navigate('/')}
        setCarouselApi={setApi}
      />
      <Button
        variant="ghost"
        className="fixed top-2 right-2 z-50 text-white hover:bg-white/10 hover:text-white"
        size="icon-lg"
        nativeButton={false}
        render={<Link to="/" />}
      >
        <XIcon />
        <span className="sr-only">Back to feed</span>
      </Button>
    </div>
  );
}

export default PostPage;
