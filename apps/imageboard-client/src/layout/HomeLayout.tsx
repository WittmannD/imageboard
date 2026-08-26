import { Outlet } from 'react-router';
import { Header } from 'src/components/features/header/Header.tsx';
import PostPage from 'src/routes/post/$id.tsx';

function HomeLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
        <PostPage />
      </main>
    </>
  );
}

export { HomeLayout };
