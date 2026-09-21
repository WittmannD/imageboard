import { LogInForm } from 'src/components/features/forms/login/LogInForm.tsx';
import { redirect, type LoaderFunction } from 'react-router';

interface LoginPageLoaderData {
  uid: string;
}

export const loader: LoaderFunction = ({ request }): LoginPageLoaderData | Response => {
  const uid = new URL(request.url).searchParams.get('uid');

  if (!uid) {
    return redirect('/');
  }

  return { uid };
};

function LoginPage({ loaderData }: { loaderData: LoginPageLoaderData }) {
  const { uid } = loaderData;

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LogInForm uid={uid} />
      </div>
    </div>
  );
}

export default LoginPage;
