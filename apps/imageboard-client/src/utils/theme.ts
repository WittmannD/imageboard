import { getStorageItem, setStorageItem, THEME, } from 'src/utils/local-storage.ts';

export type ThemeName = 'light' | 'dark';

export const isThemeName = (value: unknown): value is ThemeName => {
  return value === 'light' || value === 'dark';
};

export const getSystemTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const getCurrentTheme = (): ThemeName => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const loadTheme = (): ThemeName | null => {
  const value = getStorageItem(THEME);
  return isThemeName(value) ? value : null;
};

export const saveTheme = (theme: string) => {
  setStorageItem(THEME, theme);
};

export const applyTheme = (theme: ThemeName) => {
  document.documentElement.className = theme;
  saveTheme(theme);
};
