import { data, Link, type LoaderFunction } from 'react-router';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from 'src/components/ui/alert/Alert.tsx';
import { AlertCircleIcon } from 'lucide-react';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';
import {
  type AuthError,
  base64UrlAuthErrorSchema,
} from 'src/schemas/auth-error.schema.ts';
import { Button } from 'src/components/ui/button/Button.tsx';

export interface AuthErrorPageLoaderData {
  error?: AuthError;
}

export const loader: LoaderFunction = async ({ request, url }) => {
  const oidc = await getOidcSessionFromCookie(request);
  const oidcState = oidc.get('state');
  const headers = new Headers();

  if (oidcState) {
    headers.append('Set-Cookie', await oidcSession.destroySession(oidc));
  }

  const errorParam = url.searchParams.get('error');
  const parseResult = base64UrlAuthErrorSchema.safeParse(errorParam);

  return data<AuthErrorPageLoaderData>(
    { error: parseResult.data },
    {
      headers,
    },
  );
};

function AuthErrorPage({ loaderData }: { loaderData: AuthErrorPageLoaderData } ) {
  const { error } = loaderData;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircleIcon />
        <AlertTitle>Authorization failed</AlertTitle>
        <AlertDescription>
          <code><pre>{error?.error}</pre></code>
          <Link to={'/'}><Button>Return</Button></Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default AuthErrorPage;
