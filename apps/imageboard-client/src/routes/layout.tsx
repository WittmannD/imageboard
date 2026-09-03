import { type LoaderFunction, Outlet } from 'react-router';
import { Header } from 'src/components/features/header/Header.tsx';
import PostPage from 'src/routes/post/$id.tsx';
import { DialogManagerProvider } from 'src/lib/dialog-manager/context.tsx';
import { decodeDialogParams } from 'src/lib/dialog-manager/params.ts';

export interface ModalData {
  name: string | null;
  params: object | null;
}

export const loader: LoaderFunction = async ({ request }): Promise<ModalData> => {
  const searchParams = new URL(request.url).searchParams;
  const modal = searchParams.get('modal');
  const encodedParams = searchParams.get('params');

  return {
    name: modal,
    params: encodedParams ? decodeDialogParams(encodedParams) : null,
  };
};

function HomeLayout() {
  return (
    <DialogManagerProvider>
      <Header />
      <main className="min-h-[calc(100svh-var(--header-height))]">
        <Outlet />
        <PostPage />
      </main>
    </DialogManagerProvider>
  );
}

export default HomeLayout;
