import { Post } from 'src/components/features/post/Post.tsx';
import { useGetPostsInfiniteQuery } from 'src/services/api/post/api.ts';
import { useMemo, useRef } from 'react';
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
  // observing only while idle means each loaded page re-checks the sentinel
  // against the new layout, and nothing fires while a request is in flight
  useIntersectionObserver(loadMoreRef, () => fetchNextPage(), {
    threshold: 1.0,
    enabled: hasNextPage && !isFetching,
  });

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
