import { isRejectedWithValue } from '@reduxjs/toolkit';
import { isClient } from 'src/lib/utils/is-client.ts';
import { startAppListening } from 'src/services/store/middlewares/listener-middleware.ts';

const UNAUTHORIZED_STATUS = 401;

startAppListening({
  matcher: isRejectedWithValue,
  effect: (action) => {
    if (isClient()) return;

    const payload = action.payload as { status?: number | string } | undefined;
    if (payload?.status !== UNAUTHORIZED_STATUS) return;

    // already on an auth route - avoid looping back into itself
    if (window.location.pathname.startsWith('/auth')) return;

    const returnTo = `${window.location.pathname}${window.location.search}`;
    const loginUrl = new URL('/auth/login', window.location.origin);
    loginUrl.searchParams.set('returnTo', returnTo);

    window.location.assign(loginUrl.href);
  },
});
