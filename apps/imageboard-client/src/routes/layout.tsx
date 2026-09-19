import { type LoaderFunction, Outlet, useLoaderData } from 'react-router';
import { Header } from 'src/components/features/header/Header.tsx';
import { DialogManagerProvider } from 'src/lib/dialog-manager/context.tsx';
import { getModal, type ModalData } from 'src/.server/helpers/modal.ts';
import { type AuthData, getAuth } from 'src/.server/helpers/auth.ts';
import { AuthProvider } from 'src/components/features/auth/context.tsx';

interface RootLayoutData {
  modal: ModalData | null;
  auth: AuthData;
}

export const loader: LoaderFunction = async ({
  request,
}): Promise<RootLayoutData> => {
  return { modal: getModal(request), auth: await getAuth(request) };
};

function RootLayout() {
  const { modal, auth } = useLoaderData<RootLayoutData>();

  return (
    <AuthProvider auth={auth}>
      <DialogManagerProvider modal={modal}>
        <Header />
        <main className="min-h-[calc(100svh-var(--header-height))]">
          <Outlet />
        </main>
      </DialogManagerProvider>
    </AuthProvider>
  );
}

export default RootLayout;
