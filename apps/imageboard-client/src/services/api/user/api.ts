import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from 'src/services/api/base-query.ts';
import type { ProfileDto, UserDto } from 'src/services/api/types.ts';
import { USER_TAG_TYPE } from 'src/services/api/user/constants.ts';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env['VITE_API_BASE_URL'],
  }),
  tagTypes: [USER_TAG_TYPE],
  endpoints: (builder) => ({
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    getMe: builder.query<ProfileDto, void>({
      query: () => ({
        url: '/user/me',
      }),
      providesTags: (result) =>
        result ? [{ type: USER_TAG_TYPE, id: result.id }] : [],
    }),
    getUser: builder.query<UserDto, number>({
      query: (id) => ({
        url: `/user/${id}`,
      }),
      providesTags: (_, __, id) => [{ type: USER_TAG_TYPE, id }],
    }),
    updateUsername: builder.mutation<ProfileDto, string>({
      query: (username) => ({
        url: '/user/me',
        method: 'PATCH',
        data: { username },
      }),
      invalidatesTags: (result) =>
        result ? [{ type: USER_TAG_TYPE, id: result.id }] : [],
    }),
    uploadAvatar: builder.mutation<ProfileDto, File>({
      query: (avatar) => {
        const formData = new FormData();

        formData.append('avatar', avatar);

        return {
          url: '/user/me/avatar',
          method: 'POST',
          data: formData,
        };
      },
      invalidatesTags: (result) =>
        result ? [{ type: USER_TAG_TYPE, id: result.id }] : [],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetUserQuery,
  useLazyGetUserQuery,
  useUpdateUsernameMutation,
  useUploadAvatarMutation,
} = userApi;