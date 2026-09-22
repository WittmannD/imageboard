import { AlertCircleIcon } from 'lucide-react';
import { data, Link, type LoaderFunction } from 'react-router';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import {
  type AuthError,
  parseAuthError,
} from 'src/.server/helpers/auth-error.ts';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';

export interface AuthErrorPageLoaderData {
  error?: AuthError;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    'Access was not granted, so you have not been signed in. You can try again whenever you like.',
  server_error: 'Something went wrong on our end. Please try again shortly.',
};

const DEFAULT_MESSAGE =
  "We couldn't complete that request. Please try again.";

export const loader: LoaderFunction = async ({ request, url }) => {
  const oidc = await getOidcSessionFromCookie(request);
  const oidcState = oidc.get('state');
  const headers = new Headers();

  if (oidcState) {
    headers.append('Set-Cookie', await oidcSession.destroySession(oidc));
  }

  const error = parseAuthError(url.searchParams.get('error'));

  return data<AuthErrorPageLoaderData>({ error }, { headers });
};

function AuthErrorPage({ loaderData }: { loaderData: AuthErrorPageLoaderData }) {
  const { error } = loaderData;
  const message = error ? (AUTH_ERROR_MESSAGES[error.error] ?? DEFAULT_MESSAGE) : DEFAULT_MESSAGE;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="items-center text-center">
            <AlertCircleIcon className="text-destructive size-8" />
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          {error?.error_description && (
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {error.error_description}
              </p>
            </CardContent>
          )}
          <CardFooter className="justify-center">
            <Link to="/">
              <Button className="w-full" data-testid="auth-error-return-home">
                Return home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default AuthErrorPage;
