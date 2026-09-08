import { createContext, type MiddlewareFunction } from 'react-router';
import { getUserSessionFromCookie } from 'src/.server/session/user-session.server.ts';

import type { UserSession } from '../interfaces';

export const apiCredentialsContext = createContext<UserSession | null>(null);

export const authMiddleware: MiddlewareFunction = async ({ request, context }) => {
  const user = await getUserSessionFromCookie(request);
  const tokens = user.get('state');

  if (!tokens) {
    // throw redirect('/login');
    return;
  }

  context.set(apiCredentialsContext, tokens);
};
