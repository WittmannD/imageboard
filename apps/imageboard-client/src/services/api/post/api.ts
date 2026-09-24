import { createApi } from '@reduxjs/toolkit/query/react';
import { publicConfig } from 'src/lib/config.ts';
import { axiosBaseQuery } from 'src/services/api/base-query.ts';

import type {
  CreatePostBody,
  GetPostsQuery,
  GetPostsResponse,
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
  }),
});

export const { useGetPostsInfiniteQuery, useGetPostQuery, useCreatePostMutation } =
  postsApi;