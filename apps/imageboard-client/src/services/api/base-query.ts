import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { AxiosError,type AxiosRequestConfig } from 'axios';

interface AxiosBaseQueryOptions {
  baseUrl?: string;
}

// Define the arguments that your endpoints will pass
interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
}

export const axiosBaseQuery =
  (options?: AxiosBaseQueryOptions): BaseQueryFn<AxiosBaseQueryArgs> => {
    const axiosInstance = axios.create({
      baseURL: options?.baseUrl,
    });

    return async ({ url, method = 'GET', data, params, headers }, api) => {
      try {
        const result = await axiosInstance({
          url,
          method,
          data,
          params,
          headers,

          signal: api.signal
        });

        // RTK Query expects a 'data' key on success
        return {
          data: result.data
        };
      } catch (axiosError) {
        const err = axiosError as AxiosError;

        // RTK Query expects an 'error' key on failure
        return {
          error: {
            status: err.response?.status ?? err.code,
            data: err.response?.data ?? err.message
          },
        };
      }
    };
  };
