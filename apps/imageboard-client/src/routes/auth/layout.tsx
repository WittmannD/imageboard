import { Link, type LoaderFunction, Outlet, useLoaderData } from 'react-router';
import { type AuthData, getAuth } from 'src/.server/helpers/auth.ts';
import { AuthProvider } from 'src/components/features/auth/context.tsx';
import { Logo } from 'src/components/ui/logo/Logo.tsx';

export const loader: LoaderFunction = ({ request }): Promise<AuthData> =>
  getAuth(request);

function AuthLayout() {
  const auth = useLoaderData<AuthData>();

  return (
    <AuthProvider auth={auth}>
      <header className="w-full h-[var(--header-height)] relative overflow-hidden">
        <div className="flex items-center justify-between container mx-auto px-4 h-full relative">
          <Link to="/">
            <Logo width={185} height={35} className="dark:text-white" />
          </Link>
        </div>
      </header>
      <main className="min-h-[calc(100svh-var(--header-height))]">
        <Outlet />
      </main>
    </AuthProvider>
  );
}

export default AuthLayout;
