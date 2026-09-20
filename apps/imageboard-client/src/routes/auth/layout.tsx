import { type LoaderFunction, Outlet, useLoaderData } from 'react-router';
import { Header } from 'src/components/features/header/Header.tsx';
import { type AuthData, getAuth } from 'src/.server/helpers/auth.ts';
import { AuthProvider } from 'src/components/features/auth/context.tsx';

export const loader: LoaderFunction = ({ request }): Promise<AuthData> =>
  getAuth(request);

function AuthLayout() {
  const auth = useLoaderData<AuthData>();

  return (
    <AuthProvider auth={auth}>
      <Header />
      <main>
        <Outlet />
      </main>
    </AuthProvider>
  );
}

export default AuthLayout;
