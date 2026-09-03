import { combineReducers } from '@reduxjs/toolkit';
import { postsApi } from 'src/services/api/post.ts';

export const rootReducer = combineReducers({
  [postsApi.reducerPath]: postsApi.reducer,
});
