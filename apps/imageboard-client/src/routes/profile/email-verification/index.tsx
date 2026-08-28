import { AlertCircleIcon, CheckCircle2 } from 'lucide-react';
import {
  type ActionFunction,
  data,
  Form,
  type LoaderFunction,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from 'src/components/ui/alert/Alert.tsx';
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from 'src/components/ui/field/Field.tsx';
import { Input } from 'src/components/ui/input/Input.tsx';
import { getUserInfo } from 'src/.server/helpers/oidc.ts';
import {
  completeEmailVerification,
  requestEmailVerification,
} from 'src/.server/helpers/verification.ts';
import { getAuthSessionFromCookie } from 'src/.server/session/auth-session.server.ts';

const RETURN_TO = '/profile/email-verification';

interface EmailVerificationLoaderData {
  email?: string;
  emailVerified: boolean;
}

type EmailVerificationActionData =
  | { intent: 'request'; sessionId: string }
  | { intent: 'verify'; verified: true }
  | { intent: 'verify'; verified: false; sessionId: string; error: string };

export const loader: LoaderFunction = async ({ request }) => {
  const auth = await getAuthSessionFromCookie(request);
  const tokens = auth.get('state');

  if (!tokens) {
    return redirect(`/auth/login?returnTo=${encodeURIComponent(RETURN_TO)}`);
  }

  const userInfo = await getUserInfo(tokens.accessToken);

  return data<EmailVerificationLoaderData>({
    email: userInfo.email,
    emailVerified: Boolean(userInfo.email_verified),
  });
};

export const action: ActionFunction = async ({ request }) => {
  const auth = await getAuthSessionFromCookie(request);
  const tokens = auth.get('state');

  if (!tokens) {
    return redirect(`/auth/login?returnTo=${encodeURIComponent(RETURN_TO)}`);
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'request') {
    const userInfo = await getUserInfo(tokens.accessToken);
    const { sessionId } = await requestEmailVerification(userInfo.sub);

    return data<EmailVerificationActionData>({ intent: 'request', sessionId });
  }

  if (intent === 'verify') {
    const sessionId = String(formData.get('sessionId') ?? '');
    const otp = String(formData.get('otp') ?? '');
    const { verified } = await completeEmailVerification(sessionId, otp);

    if (!verified) {
      return data<EmailVerificationActionData>({
        intent: 'verify',
        verified: false,
        sessionId,
        error: 'Invalid or expired code. Please try again.',
      });
    }

    return data<EmailVerificationActionData>({ intent: 'verify', verified: true });
  }

  throw new Response('Bad Request', { status: 400 });
};

function EmailVerificationPage({
  loaderData,
}: {
  loaderData: EmailVerificationLoaderData;
}) {
  const { email, emailVerified } = loaderData;
  const actionData = useActionData<EmailVerificationActionData>();
  const navigation = useNavigation();

  const isSubmittingIntent = (intent: 'request' | 'verify') =>
    navigation.state === 'submitting' &&
    navigation.formData?.get('intent') === intent;

  const verified =
    emailVerified || (actionData?.intent === 'verify' && actionData.verified);

  const sessionId =
    actionData?.intent === 'request'
      ? actionData.sessionId
      : actionData?.intent === 'verify' && !actionData.verified
        ? actionData.sessionId
        : undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              {email
                ? `We use ${email} to keep your account secure.`
                : 'Confirm your email address to secure your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verified ? (
              <Alert>
                <CheckCircle2 />
                <AlertTitle>Email verified</AlertTitle>
                <AlertDescription>
                  Your email address has been verified.
                </AlertDescription>
              </Alert>
            ) : sessionId ? (
              <Form method="post">
                <input type="hidden" name="intent" value="verify" />
                <input type="hidden" name="sessionId" value={sessionId} />
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="otp">Verification code</FieldLabel>
                    <Input
                      id="otp"
                      name="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="123456"
                      required
                    />
                    <FieldDescription>
                      Enter the 6-digit code we sent to your email.
                    </FieldDescription>
                  </Field>
                  {actionData?.intent === 'verify' && !actionData.verified && (
                    <Alert variant="destructive">
                      <AlertCircleIcon />
                      <AlertTitle>{actionData.error}</AlertTitle>
                    </Alert>
                  )}
                  <Field>
                    <Button type="submit" disabled={isSubmittingIntent('verify')}>
                      {isSubmittingIntent('verify') ? 'Verifying...' : 'Verify email'}
                    </Button>
                  </Field>
                </FieldGroup>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="intent" value="request" />
                <FieldGroup>
                  <Field>
                    <Button type="submit" disabled={isSubmittingIntent('request')}>
                      {isSubmittingIntent('request')
                        ? 'Sending...'
                        : 'Send verification code'}
                    </Button>
                  </Field>
                </FieldGroup>
              </Form>
            )}
          </CardContent>
          {!verified && sessionId && (
            <CardFooter className="justify-center">
              <Form method="post">
                <input type="hidden" name="intent" value="request" />
                <Button
                  variant="outline"
                  type="submit"
                  disabled={isSubmittingIntent('request')}
                >
                  {isSubmittingIntent('request') ? 'Sending...' : 'Resend code'}
                </Button>
              </Form>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
