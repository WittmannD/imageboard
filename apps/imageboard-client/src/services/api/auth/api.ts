import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from 'src/services/api/base-query.ts';

interface LoginRequest {
  uid: string;
  email: string;
  password: string;
}

interface RegisterRequest {
  uid: string;
  username: string;
  email: string;
  password: string;
}

interface InteractionResponse {
  redirectTo: string;
}

// The identity provider is a different origin from the app's own API - the
// interaction endpoints rely on the cookie oidc-provider set for this
// browser during the authorization redirect, so credentials must ride along.
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery({
    baseUrl: import.meta.env['VITE_OIDC_ISSUER_URL'],
    withCredentials: true,
  }),
  endpoints: (builder) => ({
    login: builder.mutation<InteractionResponse, LoginRequest>({
      query: ({ uid, ...data }) => ({
        url: `/interactions/${uid}/login`,
        method: 'POST',
        data,
      }),
    }),
    register: builder.mutation<InteractionResponse, RegisterRequest>({
      query: ({ uid, ...data }) => ({
        url: `/interactions/${uid}/registration`,
        method: 'POST',
        data,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
