import React, { useLayoutEffect, useState } from 'react';
import { applyTheme, getCurrentTheme } from 'src/utils/theme';
import { Moon, Sun } from 'lucide-react';
import { Button } from 'src/components/ui/button/Button.tsx';

export function ThemeToggle(props: React.ComponentProps<typeof Button> & {}) {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useLayoutEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  const toggle = () => {
    if (!theme) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  if (theme === null) {
    return (
      <Button
        size="icon"
        aria-label="Loading theme..."
        onClick={toggle}
        {...props}
      >
        <Sun />
      </Button>
    );
  }

  const isDarkTheme = theme === 'dark';
  return (
    <Button
      size="icon"
      aria-label="Loading theme..."
      onClick={toggle}
      {...props}
    >
      {isDarkTheme ? <Moon /> : <Sun />}
    </Button>
  );
}
