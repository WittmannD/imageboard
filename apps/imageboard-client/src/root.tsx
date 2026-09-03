import React from 'react';
import {
  Links,
  Meta,
  type MiddlewareFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { store } from 'src/services/store/store.ts';
import { ThemeProvider } from 'src/components/features/theme/ThemeProvider.tsx';
import { Provider } from 'react-redux';
import { authMiddleware } from 'src/.server/middlewares/auth-middleware.ts';

export const middleware: MiddlewareFunction[] = [authMiddleware];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My App</title>
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
      <ThemeProvider />
      <Outlet />
    </Provider>
  );
}
