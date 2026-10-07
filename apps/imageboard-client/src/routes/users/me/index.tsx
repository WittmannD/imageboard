import { useAuth } from 'src/components/features/auth/context.tsx';
import { useGetMeQuery } from 'src/services/api/user/api.ts';
import { ProfileView } from 'src/components/features/profile/ProfileView.tsx';
import type { PostStatus } from 'src/services/api/types.ts';
import { useGetUserPostsInfiniteQuery } from 'src/services/api/post/api.ts';
import { useMemo } from 'react';
import { Feed } from 'src/components/features/feed/Feed.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'src/components/ui/tabs/Tabs.tsx';

const FEED_POSTS_POLLING_INTERVAL = 20000;
const FEED_POSTS_PAGE_SIZE = 10;

enum PostsTabValue {
  Published = 'published',
  Archived = 'archived',
}

function MyPostsFeed({
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
    <div className="pb-8">
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

function MyProfilePage() {
  const auth = useAuth(true);
  const { data: user } = useGetMeQuery(undefined, { skip: !auth.isLoggedIn });

  // useAuth(true) only redirects after render - auth.user is still undefined
  // here when the session has expired
  if (!auth.user || !user) {
    return null;
  }

  return (
    <div>
      <ProfileView
        user={user}
        unverifiedEmail={auth.user.emailVerified ? undefined : user.email}
      />
      <div className="mt-8 mx-auto w-full max-w-xl">
        <Tabs defaultValue={PostsTabValue.Published}>
          <div className="px-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">My posts</h2>
            <TabsList>
              <TabsTrigger value={PostsTabValue.Published}>
                Published
              </TabsTrigger>
              <TabsTrigger value={PostsTabValue.Archived}>Archived</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={PostsTabValue.Published} keepMounted={false}>
            <MyPostsFeed userId={user.id} status="Published" />
          </TabsContent>
          <TabsContent value={PostsTabValue.Archived} keepMounted={false}>
            <MyPostsFeed userId={user.id} status="Unpublished" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default MyProfilePage;
