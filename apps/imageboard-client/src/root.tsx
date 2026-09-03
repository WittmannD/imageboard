import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Links,
  Meta,
  type MiddlewareFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { store } from 'src/services/store/store.ts';
import { Provider } from 'react-redux';
import { authMiddleware } from 'src/.server/middlewares/auth-middleware.ts';
import {
  getStorageItem,
  setStorageItem,
  THEME,
} from 'src/utils/local-storage.ts';
import { getSystemTheme } from 'src/utils/theme.ts';

export const middleware: MiddlewareFunction[] = [authMiddleware];

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'dark';
    }
    return getStorageItem(THEME) || getSystemTheme();
  });

  useLayoutEffect(() => {
    const storedTheme = getStorageItem(THEME);
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    setStorageItem(THEME, theme);
  }, [theme]);

  return (
    <html lang="en" className={theme}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My App</title>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Sets correct theme on initial load
          dangerouslySetInnerHTML={{
            __html: `
             (function () {
              try {
               var theme = localStorage.getItem("${THEME}");
               console.log('custom script: stored theme:', theme)
               if (!theme) {
                theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
               }
               document.documentElement.className = theme;
              } catch (_) {}
             })();
           `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <Provider store={store}>
      <Outlet />
    </Provider>
  );
}
