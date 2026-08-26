import { combineReducers } from '@reduxjs/toolkit';
import { postsApi } from 'src/services/api/post.ts';
import themeReducer from 'src/services/store/theme-reducer.ts';

export const rootReducer = combineReducers({
  theme: themeReducer,
  [postsApi.reducerPath]: postsApi.reducer,
});
