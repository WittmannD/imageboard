import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
} from 'react';
import type { AuthData } from 'src/.server/helpers/auth.ts';
import { redirectToLogin } from 'src/lib/utils/login-redirect.ts';

export interface AuthContextValue extends AuthData {}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(guard: true): Required<AuthContextValue>;
export function useAuth(guard: false): AuthContextValue;
export function useAuth(
  guard: boolean = false,
): Required<AuthContextValue> | AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }

  const shouldRedirect = guard && !context.isLoggedIn;

  useEffect(() => {
    if (!shouldRedirect) return;

    redirectToLogin(`${window.location.pathname}${window.location.search}`);
  }, [shouldRedirect]);

  return context;
}

export function AuthProvider({
  children,
  auth,
}: PropsWithChildren & { auth: AuthData }) {
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
