import { Post } from 'src/components/features/post/Post.tsx';
import { PostSkeleton } from 'src/components/features/post/PostSkeleton.tsx';
import useIntersectionObserver from 'src/hooks/useIntersectionObserver.ts';
import { useRef } from 'react';
import type { PostDto } from 'src/services/api/types.ts';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from 'src/components/ui/empty/Empty';
import { GhostIcon } from 'lucide-react';
import { Button } from 'src/components/ui/button/Button';
import { Link } from 'react-router';

function Placeholder() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GhostIcon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>No posts yet</EmptyTitle>
        <EmptyDescription>
          This place is <i>spotless</i>. Make some mess by creating your first
          post.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button nativeButton={false} render={<Link to="/posts/create" />}>
          Create post
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function Feed({
  hasNextPage,
  fetchNextPage,
  isFetching,
  isFetchingNextPage,
  isLoading,
  posts,
}: {
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  posts: PostDto[];
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // observing only while idle means each loaded page re-checks the sentinel
  // against the new layout, and nothing fires while a request is in flight
  useIntersectionObserver(loadMoreRef, () => fetchNextPage(), {
    threshold: 1.0,
    enabled: hasNextPage && !isFetching && !isLoading,
  });

  if (!isLoading && posts.length === 0) return <Placeholder />;

  return (
    <section className="container mx-auto px-4 max-w-xl space-y-8">
      {isLoading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : (
        <>
          {posts.map((post) => (
            <Post key={post.id} data={post} />
          ))}
          <div ref={loadMoreRef} className="my-8">
            {isFetchingNextPage && <PostSkeleton />}
          </div>
        </>
      )}
    </section>
  );
}

export { Feed };
