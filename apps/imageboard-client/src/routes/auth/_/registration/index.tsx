import { SignupForm } from 'src/components/features/signup/Signup.tsx';
import type { LoaderFunction } from 'react-router';

interface LoginPageLoaderData {
  action: string;
}

export const loader: LoaderFunction = async ({
  url,
}): Promise<LoginPageLoaderData> => {
  const uid = url.searchParams.get('uid');

  const action = new URL(
    `/interactions/${uid}/registration`,
    process.env.OIDC_ISSUER_URI,
  ).toString();

  return {
    action,
  };
};

function RegistrationPage({ loaderData }: { loaderData: LoginPageLoaderData }) {
  const { action } = loaderData;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm action={action} />
      </div>
    </div>
  );
}

export default RegistrationPage;
