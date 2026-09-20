import { SignUpForm } from 'src/components/features/forms/signup/SignUpForm.tsx';
import  { type LoaderFunction } from 'react-router';

interface RegistrationPageLoaderData {
  action: string;
  error?: string;
  email?: string;
  username?: string;
}

export const loader: LoaderFunction = async ({
  url,
}): Promise<RegistrationPageLoaderData> => {
  const uid = url.searchParams.get('uid');

  const action = new URL(
    `/interactions/${uid}/registration`,
    process.env['OIDC_ISSUER_URL'],
  ).toString();

  return {
    action,
    error: url.searchParams.get('error') ?? undefined,
    email: url.searchParams.get('email') ?? undefined,
    username: url.searchParams.get('username') ?? undefined,
  };
};

function RegistrationPage({ loaderData }: { loaderData: RegistrationPageLoaderData }) {
  const { action, error, email, username } = loaderData;

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm
          action={action}
          error={error}
          defaultEmail={email}
          defaultUsername={username}
        />
      </div>
    </div>
  );
}

export default RegistrationPage;
