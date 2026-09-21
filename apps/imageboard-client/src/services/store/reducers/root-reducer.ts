import { combineReducers } from '@reduxjs/toolkit';
import { authApi } from 'src/services/api/auth/api.ts';
import { postsApi } from 'src/services/api/post/api.ts';
import { userApi } from 'src/services/api/user/api.ts';

export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [postsApi.reducerPath]: postsApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
});
