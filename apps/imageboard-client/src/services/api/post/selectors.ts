import { createSelector } from '@reduxjs/toolkit';

import { postsApi } from './api.ts';

export const selectPostById = (id: number) =>
  createSelector(postsApi.endpoints.getPosts.select(undefined), (result) =>
    result.data?.items.find((p) => p.id === id),
  );

