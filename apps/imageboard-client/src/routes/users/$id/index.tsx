import { useParams } from 'react-router';
import { useGetUserQuery } from 'src/services/api/user/api.ts';
import { ProfileView } from 'src/components/features/profile/ProfileView.tsx';
import { useGetUserPostsInfiniteQuery } from 'src/services/api/post/api.ts';
import { useMemo } from 'react';
import { Feed } from 'src/components/features/feed/Feed.tsx';
import type { PostStatus } from 'src/services/api/types.ts';

const FEED_POSTS_POLLING_INTERVAL = 20000;
const FEED_POSTS_PAGE_SIZE = 10;

function UserPostsFeed({
  userId,
  status,
}: {
  userId: number;
  status: PostStatus;
}) {
  const {
    data,
    isFetching,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetUserPostsInfiniteQuery(
    {
      userId,
      status,
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
    <div className="pt-4 pb-8">
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

function UserProfilePage() {
  const params = useParams();
  const userId = Number(params['id']);

  const { data: user } = useGetUserQuery(userId);

  if (!user) {
    return null;
  }

  return (
    <div className="py-8">
      <ProfileView user={user} />
      <div className="mt-8 mx-auto w-full max-w-xl">
        <h2 className="pl-4 text-2xl font-bold">
          {user.username}'s recent posts
        </h2>
        <UserPostsFeed userId={userId} status="Published" />
      </div>
    </div>
  );
}

export default UserProfilePage;
