import { Post } from 'src/components/features/post/Post.tsx';
import { useGetPostsInfiniteQuery } from 'src/services/api/post/api.ts';
import { useMemo, useRef } from 'react';
import useIntersectionObserver from 'src/hooks/useIntersectionObserver.ts';
import { LoaderCircleIcon } from 'lucide-react';

const FEED_POSTS_POLLING_INTERVAL = 20000;
const FEED_POSTS_PAGE_SIZE = 10;

function FeedPage() {
  const {
    data,
    isFetching,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetPostsInfiniteQuery(
    {
      limit: FEED_POSTS_PAGE_SIZE,
      order: 'DESC',
    },
    {
      pollingInterval: FEED_POSTS_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
    },
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  // observing only while idle means each loaded page re-checks the sentinel
  // against the new layout, and nothing fires while a request is in flight
  useIntersectionObserver(loadMoreRef, () => fetchNextPage(), {
    threshold: 1.0,
    enabled: hasNextPage && !isFetching && !isLoading,
  });

  return (
    <div>
      <section className="container mx-auto px-4 py-8 max-w-xl space-y-8">
        {posts.map((post) => (
          <Post key={post.id} data={post} />
        ))}
        <div
          ref={loadMoreRef}
          className="flex justify-center items-center h-8 my-8"
        >
          {(isFetchingNextPage || isFetching) && (
            <LoaderCircleIcon className="animate-spin size-6" />
          )}
        </div>
      </section>
    </div>
  );
}

export default FeedPage;
