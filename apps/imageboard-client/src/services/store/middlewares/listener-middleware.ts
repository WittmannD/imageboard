import { addListener,createListenerMiddleware } from '@reduxjs/toolkit';

import type { AppDispatch,RootState } from './store.ts';

declare type ExtraArgument = object;

export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch,
  ExtraArgument
>();

export const addAppListener = addListener.withTypes<RootState, AppDispatch>();
