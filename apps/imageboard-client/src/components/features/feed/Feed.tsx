import { Post } from 'src/components/features/post/Post.tsx';
import { PostSkeleton } from 'src/components/features/post/PostSkeleton.tsx';
import useIntersectionObserver from 'src/hooks/useIntersectionObserver.ts';
import { useRef } from 'react';
import type { PostDto } from 'src/services/api/types.ts';

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

  return (
    <section className="container mx-auto px-4 py-8 max-w-xl space-y-8">
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
            {(isFetchingNextPage || isFetching) && <PostSkeleton />}
          </div>
        </>
      )}
    </section>
  );
}

export { Feed };
