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

export interface ConsentDetails {
  client: {
    id: string;
    name: string;
    uri?: string;
    logoUri?: string;
    policyUri?: string;
    tosUri?: string;
  };
  account: { username: string; email: string };
  scopes: string[];
}

interface ConsentRequest {
  uid: string;
}

interface RequestPasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
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
    getConsent: builder.query<ConsentDetails, ConsentRequest>({
      query: ({ uid }) => ({ url: `/interactions/${uid}/consent` }),
    }),
    grantConsent: builder.mutation<InteractionResponse, ConsentRequest>({
      query: ({ uid }) => ({
        url: `/interactions/${uid}/consent`,
        method: 'POST',
      }),
    }),
    denyConsent: builder.mutation<InteractionResponse, ConsentRequest>({
      query: ({ uid }) => ({
        url: `/interactions/${uid}/consent/deny`,
        method: 'POST',
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    requestPasswordReset: builder.mutation<void, RequestPasswordResetRequest>({
      query: (data) => ({
        url: '/password-reset',
        method: 'POST',
        data,
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (data) => ({
        url: '/password-reset/complete',
        method: 'POST',
        data,
      }),
    }),
  }),
});

export const {
  useDenyConsentMutation,
  useGetConsentQuery,
  useGrantConsentMutation,
  useLoginMutation,
  useRegisterMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} = authApi;
