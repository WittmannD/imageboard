import {
  data,
  isRouteErrorResponse,
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from 'react-router';
import { fetchPost } from 'src/.server/helpers/post.ts';
import { apiCredentialsContext } from 'src/.server/middlewares/auth-middleware.ts';
import { PostLightboxView } from 'src/components/features/post/PostLightboxView.tsx';
import { useCarouselKeydownFallback } from 'src/components/ui/carousel/Carousel.tsx';
import NotFoundPage from 'src/routes/not-found/index.tsx';
import { useGetPostQuery } from 'src/services/api/post/api.ts';
import type { PostDto } from 'src/services/api/types.ts';
import { buildPostMeta, SITE_NAME } from 'src/lib/utils/meta.ts';

interface PostLoaderData {
  /** null when the server couldn't prefetch it; the client query fetches it. */
  post: PostDto | null;
}

function parsePostId(id: string | undefined) {
  const postId = Number(id);

  return Number.isSafeInteger(postId) && postId > 0 ? postId : null;
}

export async function loader({
  params,
  context,
}: LoaderFunctionArgs): Promise<PostLoaderData> {
  const postId = parsePostId(params['id']);

  if (postId === null) {
    throw data(null, { status: 404 });
  }

  const result = await fetchPost(
    postId,
    context.get(apiCredentialsContext)?.accessToken,
  );

  if (result.status === 'not-found') {
    throw data(null, { status: 404 });
  }

  return { post: result.status === 'ok' ? result.post : null };
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  if (!loaderData?.post) {
    return [
      { title: loaderData ? SITE_NAME : `Post not found · ${SITE_NAME}` },
    ];
  }

  return buildPostMeta(loaderData.post);
};

function PostPage({ params }: { params: { id: string } }) {
  const { post: prefetchedPost } = useLoaderData<PostLoaderData>();
  // still subscribed when prefetched: likes and status changes patch and
  // invalidate this cache entry
  const { data: fetchedPost, isError } = useGetPostQuery(Number(params.id));
  const post = fetchedPost ?? prefetchedPost;
  const [searchParams] = useSearchParams();
  const { setApi, handleKeyDownCapture } = useCarouselKeydownFallback();

  if (!post) {
    return isError ? (
      <NotFoundPage />
    ) : (
      <div className="h-dvh w-full bg-black" />
    );
  }

  return (
    <div onKeyDownCapture={handleKeyDownCapture}>
      <PostLightboxView
        post={post}
        initialPhotoId={searchParams.get('photoId') ?? undefined}
        setCarouselApi={setApi}
      />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  throw error;
}

export default PostPage;
