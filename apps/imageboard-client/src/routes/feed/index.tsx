import { Post } from 'src/components/features/post/Post.tsx';
import { useGetPostsQuery } from 'src/services/api/post.ts';

function FeedPage() {
  const { data } = useGetPostsQuery({
    limit: 10,
    order: 'DESC',
  });

  return (
    <div>
      <section className="container mx-auto px-4 py-8 max-w-xl space-y-8">
        {data?.items.map((post) => (
          <Post key={post.id} data={post} />
        ))}
      </section>
    </div>
  );
}

export default FeedPage;
