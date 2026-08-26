import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, } from '@reduxjs/toolkit';
import { startAppListening, } from 'src/services/store/listener-middleware.ts';

import type { RootState } from './store.ts';

export type ThemeName = 'light' | 'dark';
const THEME_LOCAL_STORAGE_KEY = 'theme';

const getInitialTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const loadTheme = (): ThemeName | null => {
  try {
    return (localStorage.getItem(THEME_LOCAL_STORAGE_KEY) ?? null) as ThemeName | null;
  } catch {
    return null;
  }
};

const saveTheme = (theme: string) => {
  try {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

// Define a type for the slice state
interface ThemeState {
  name: ThemeName;
}

// Define the initial state using that type
const initialState: ThemeState = {
  name: loadTheme() ?? getInitialTheme()
};

export const themeReducer = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeName>) => {
      state.name = action.payload;
    },
    toggleTheme: (state) => {
      state.name = state.name === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeReducer.actions;
export const selectTheme = (state: RootState) => state.theme.name;
export const selectIsDarkTheme = (state: RootState) => state.theme.name === 'dark';

startAppListening({
  predicate: (_action, currentState, previousState) => {
    return currentState.theme !== previousState.theme
  },
  effect: (_, api) => {
    saveTheme(api.getState().theme.name)
  }
})

export default themeReducer.reducer;