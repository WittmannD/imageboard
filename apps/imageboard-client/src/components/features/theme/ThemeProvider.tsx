import { useEffect } from 'react';
import { useAppSelector } from 'src/hooks/useAppState.ts';
import { selectIsDarkTheme } from 'src/services/store/theme-reducer.ts';

export function ThemeProvider() {
  const isDarkTheme = useAppSelector(selectIsDarkTheme);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  return null;
}
