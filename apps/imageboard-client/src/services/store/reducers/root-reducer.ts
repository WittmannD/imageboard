import { combineReducers } from '@reduxjs/toolkit';
import { postsApi } from 'src/services/api/post/api.ts';
import { userApi } from 'src/services/api/user/api.ts';

export const rootReducer = combineReducers({
  [postsApi.reducerPath]: postsApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
});
