import { createContext, type MiddlewareFunction } from 'react-router';
import { getAuthSessionFromCookie } from 'src/.server/session/auth-session.server.ts';

import type { Credentials } from '../interfaces';

export const apiCredentialsContext = createContext<Credentials | null>(null);

export const authMiddleware: MiddlewareFunction = async ({ request, context }) => {
  const auth = await getAuthSessionFromCookie(request);
  const tokens = auth.get('state');

  if (!tokens) {
    // throw redirect('/login');
    return;
  }

  context.set(apiCredentialsContext, tokens);
};
