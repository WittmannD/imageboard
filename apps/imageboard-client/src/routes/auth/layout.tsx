import { Outlet } from 'react-router';
import { Header } from 'src/components/features/header/Header.tsx';

function AuthLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default AuthLayout;
