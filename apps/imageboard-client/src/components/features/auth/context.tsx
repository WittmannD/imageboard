import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
} from 'react';
import type { AuthData } from 'src/.server/helpers/auth.ts';
import { useNavigate } from 'react-router';

export interface AuthContextValue extends AuthData {}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(guard: true): Required<AuthContextValue>;
export function useAuth(guard: false): AuthContextValue;
export function useAuth(
  guard: boolean = false,
): Required<AuthContextValue> | AuthContextValue {
  const navigate = useNavigate();
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }

  const shouldRedirect = guard && !context.isLoggedIn;

  useEffect(() => {
    if (!shouldRedirect) return;

    const returnTo = `${window.location.pathname}${window.location.search}`;
    const loginUrl = new URL('/auth/login', window.location.origin);
    loginUrl.searchParams.set('returnTo', returnTo);

    navigate(
      { pathname: loginUrl.pathname, search: loginUrl.search },
      { replace: true },
    );
  }, [shouldRedirect, navigate]);

  return context;
}

export function AuthProvider({
  children,
  auth,
}: PropsWithChildren & { auth: AuthData }) {
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
