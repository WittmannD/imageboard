import { Post } from 'src/components/features/post/Post.tsx';
import { useGetPostsInfiniteQuery } from 'src/services/api/post/api.ts';
import { useEffect, useMemo, useRef } from 'react';
import useIntersectionObserver from 'src/hooks/useIntersectionObserver.ts';
import { LoaderCircleIcon } from 'lucide-react';

function FeedPage() {
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetPostsInfiniteQuery({
    limit: 10,
    order: 'DESC',
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );
  const entry = useIntersectionObserver(loadMoreRef, { threshold: 1.0 });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      <section className="container mx-auto px-4 py-8 max-w-xl space-y-8">
        {posts.map((post) => (
          <Post key={post.id} data={post} />
        ))}
        <div ref={loadMoreRef} className="flex justify-center items-center h-8 my-8">
          {(isFetchingNextPage || isFetching) && <LoaderCircleIcon className="animate-spin size-6" />}
        </div>
      </section>
    </div>
  );
}

export default FeedPage;
