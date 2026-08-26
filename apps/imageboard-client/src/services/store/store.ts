import { configureStore } from '@reduxjs/toolkit';
import { postsApi } from 'src/services/api/post.ts';
import { listenerMiddleware } from 'src/services/store/listener-middleware.ts';
import { rootReducer } from 'src/services/store/root-reducer.ts';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(postsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
