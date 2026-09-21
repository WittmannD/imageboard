import { SignUpForm } from 'src/components/features/forms/signup/SignUpForm.tsx';
import { redirect, type LoaderFunction } from 'react-router';

interface RegistrationPageLoaderData {
  uid: string;
}

export const loader: LoaderFunction = ({
  request,
}): RegistrationPageLoaderData | Response => {
  const uid = new URL(request.url).searchParams.get('uid');

  if (!uid) {
    return redirect('/');
  }

  return { uid };
};

function RegistrationPage({
  loaderData,
}: {
  loaderData: RegistrationPageLoaderData;
}) {
  const { uid } = loaderData;

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm uid={uid} />
      </div>
    </div>
  );
}

export default RegistrationPage;
