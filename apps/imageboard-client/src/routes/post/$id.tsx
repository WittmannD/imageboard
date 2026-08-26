import { useSearchParams } from 'react-router';
import { PostLightbox } from 'src/components/features/post-lightbox/PostLightbox.tsx';

function PostPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const open = searchParams.has('post');

  function setOpen(nextOpen: boolean) {
    const params = new URLSearchParams(searchParams);

    if (nextOpen) {
      params.set('post', '123');
    } else {
      params.delete('post');
    }

    setSearchParams(params, { replace: true });
  }

  return (
    <PostLightbox open={open} onOpenChange={setOpen} />
  );
}

export default PostPage;
