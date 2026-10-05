import { Feed } from 'src/components/features/feed/Feed.tsx';
import { useGetPostsInfiniteQuery } from 'src/services/api/post/api.ts';
import { useMemo } from 'react';


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

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  return (
    <div className="py-8">
      <Feed
        posts={posts}
        isFetching={isFetching}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </div>
  );
}

export default FeedPage;
