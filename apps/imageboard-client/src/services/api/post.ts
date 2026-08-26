import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from 'src/services/api/base-query.ts';
import { POST_LIST_TAG, POST_TAG_TYPE } from 'src/services/api/constants.ts';

import type {
  CreatePostBody,
  GetPostsQuery,
  GetPostsResponse,
  PostDraftDto,
  PostDto,
} from './types.ts';

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env['VITE_API_BASE_URL'],
  }),
  tagTypes: [POST_TAG_TYPE],
  endpoints: (builder) => ({
    getPosts: builder.query<GetPostsResponse, GetPostsQuery | undefined>({
      query: (params) => ({
        url: '/posts',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: POST_TAG_TYPE,
                id,
              })),
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

export const { useGetPostsQuery, useGetPostQuery, useLazyGetPostsQuery, useCreatePostMutation } =
  postsApi;