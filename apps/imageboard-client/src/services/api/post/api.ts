import type { TypedMutationOnQueryStarted } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';
import { publicConfig } from 'src/lib/config.ts';
import { axiosBaseQuery } from 'src/services/api/base-query.ts';
import { userApi } from 'src/services/api/user/api.ts';
import { USER_TAG_TYPE } from 'src/services/api/user/constants.ts';

import type {
  CreatePostBody,
  GetPostsQuery,
  GetPostsResponse,
  LikeStatusDto,
  PostDraftDto,
  PostDto,
} from '../types.ts';
import { POST_LIST_TAG, POST_TAG_TYPE } from './constants.ts';

const DEFAULT_PAGE_SIZE = 10;
const MAX_CACHE_PAGES = 10;

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: axiosBaseQuery({
    baseUrl: publicConfig.apiBaseUrl,
  }),
  tagTypes: [POST_TAG_TYPE],
  endpoints: (builder) => ({
    getPosts: builder.infiniteQuery<
      GetPostsResponse,
      GetPostsQuery,
      GetPostsQuery['cursor']
    >({
      query: ({ queryArg, pageParam: cursor }) => ({
        url: '/posts',
        params: {
          limit: DEFAULT_PAGE_SIZE,
          ...queryArg,
          cursor,
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        getPreviousPageParam: () => undefined,
        maxPages: MAX_CACHE_PAGES
      },
      providesTags: (result) =>
        result?.pages
          ? [
            ...result.pages.flatMap(({ items }) =>
              items.map(({ id }) => ({
                type: POST_TAG_TYPE,
                id,
              }))
            ),
            { type: POST_TAG_TYPE, id: POST_LIST_TAG },
          ]
          : [{ type: POST_TAG_TYPE, id: POST_LIST_TAG }],
    }),
    getPost: builder.query<PostDto, number>({
      query: (_id) => ({
        url: `/posts`,
      }),
      transformResponse: (response: GetPostsResponse, _, id) => {
        const item = response.items.find((i) => i.id === id);

        if (!item) {
          throw new Error();
        }

        return item;
      },
      providesTags: (_, __, id) => [{ type: POST_TAG_TYPE, id }],
    }),
    createPost: builder.mutation<PostDraftDto, CreatePostBody>({
      query: ({ caption, files }) => {
        const formData = new FormData();

        if (caption !== undefined) {
          formData.append('caption', caption);
        }

        files.forEach((file) => {
          formData.append('images', file);
        });

        return {
          url: '/posts',
          method: 'POST',
          data: formData,
        };
      },
      invalidatesTags: [{ type: POST_TAG_TYPE, id: POST_LIST_TAG }],
    }),
    // PUT likes, DELETE unlikes; both are idempotent on the server
    likePost: builder.mutation<LikeStatusDto, PostDto['id']>({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'PUT',
      }),
      onQueryStarted: (id, api) => syncLikeState(id, true, api),
    }),
    unlikePost: builder.mutation<LikeStatusDto, PostDto['id']>({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'DELETE',
      }),
      onQueryStarted: (id, api) => syncLikeState(id, false, api),
    }),
  }),
});

export const {
  useGetPostsInfiniteQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
} = postsApi;

/** Below logic for the optimistic update of the post's like counter **/

type LikeMutationLifecycleApi = Parameters<
  NonNullable<
    TypedMutationOnQueryStarted<
      LikeStatusDto,
      PostDto['id'],
      ReturnType<typeof axiosBaseQuery>,
      'postsApi'
    >
  >
>[1];

/**
 * Keeps every cached copy of a post (feed pages and getPost) in step with a
 * like/unlike, instead of invalidating tags, which would refetch every loaded
 * feed page: optimistically on request, then with the server's counts, and
 * rolled back if the request fails.
 */
async function syncLikeState(
  id: PostDto['id'],
  liked: boolean,
  api: LikeMutationLifecycleApi,
): Promise<void> {
  const { dispatch, queryFulfilled } = api;
  let authorId: number | undefined;

  // applies `update` to the post in each cache entry holding it and returns
  // the undoable patches
  const updatePost = (update: (post: PostDto) => void) => {
    const apply = (post: PostDto) => {
      authorId = post.user.id;
      update(post);
    };

    const feedPatches = postsApi.util
      // find all cached instances of post and apply patch to them
      .selectCachedArgsForQuery(api.getState(), 'getPosts')
      .map((arg) =>
        dispatch(
          postsApi.util.updateQueryData('getPosts', arg, (draft) => {
            for (const page of draft.pages) {
              page.items.filter((post) => post.id === id).forEach(apply);
            }
          }),
        ),
      );
    const postPatch = dispatch(
      postsApi.util.updateQueryData('getPost', id, apply),
    );

    return [...feedPatches, postPatch];
  };

  const optimisticPatches = updatePost((post) => {
    if (post.likedByMe !== liked) {
      post.likedByMe = liked;
      post.likesCount += liked ? 1 : -1;
    }
  });

  try {
    const { data } = await queryFulfilled;

    // the server's count also includes likes from others since the page loaded
    updatePost((post) => {
      post.likesCount = data.likesCount;
      post.likedByMe = data.likedByMe;
    });

    // the author's likesReceivedCount changed too
    if (authorId !== undefined) {
      dispatch(
        userApi.util.invalidateTags([{ type: USER_TAG_TYPE, id: authorId }]),
      );
    }
  } catch {
    optimisticPatches.forEach((patch) => {
      patch.undo();
    });
  }
}
