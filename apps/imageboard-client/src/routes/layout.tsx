import { type LoaderFunction, Outlet } from 'react-router';
import { Header } from 'src/components/features/header/Header.tsx';
import { DialogManagerProvider } from 'src/lib/dialog-manager/context.tsx';

export interface ModalData {
  name: string | null;
  params: Record<string, string>;
}

export const loader: LoaderFunction = async ({ request }): Promise<ModalData | undefined> => {
  const searchParams = new URL(request.url).searchParams;
  const modal = searchParams.get('modal');

  if (!modal) {
    return;
  }

  const params: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    if (key !== 'modal') {
      params[key] = value;
    }
  }

  return { name: modal, params };
};

function HomeLayout() {
  return (
    <DialogManagerProvider>
      <Header />
      <main className="min-h-[calc(100svh-var(--header-height))]">
        <Outlet />
      </main>
    </DialogManagerProvider>
  );
}

export default HomeLayout;
