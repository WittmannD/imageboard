import { AlertCircleIcon } from 'lucide-react';
import {
  type ActionFunction,
  data,
  Form,
  type LoaderFunction,
  redirect,
  type ShouldRevalidateFunction,
  useActionData,
  useFetcher,
  useNavigation,
} from 'react-router';

import { Alert, AlertTitle } from 'src/components/ui/alert/Alert.tsx';
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
} from 'src/components/ui/field/Field.tsx';
import {
  completeEmailVerification,
  requestEmailVerification,
} from 'src/.server/helpers/verification.ts';
import { getUserSessionFromCookie } from 'src/.server/session/auth-session.server.ts';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from 'src/components/ui/input-otp/InputOTP.tsx';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import useCountdown from 'src/hooks/useCountdown.ts';
import { format } from 'date-fns/format';

interface EmailVerificationLoaderData {
  email?: string;
  sessionId: string;
  resendAvailableAt: number;
  returnTo: string;
}

type EmailVerificationActionData =
  | { intent: 'request'; sessionId: string; resendAvailableAt: number }
  | { intent: 'verify'; verified: false; sessionId: string; error: string };

function getReturnTo(requestUrl: string) {
  return new URL(requestUrl).searchParams.get('returnTo') ?? '/';
}

/** Where to send the user to log in, preserving this page (and its returnTo) so the flow resumes here afterwards. */
function buildLoginRedirect(returnTo: string) {
  const self = `/profile/email-verification?returnTo=${encodeURIComponent(returnTo)}`;
  return `/auth/login?returnTo=${encodeURIComponent(self)}`;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserSessionFromCookie(request);
  const userState = user.get('state');
  const returnTo = getReturnTo(request.url);

  if (!userState) {
    return redirect(buildLoginRedirect(returnTo));
  }

  if (userState.emailVerified) {
    return redirect(returnTo);
  }

  // Fire off the first OTP email immediately.
  const { sessionId, resendAvailableAt } = await requestEmailVerification(
    userState.sub,
  );

  return data<EmailVerificationLoaderData>({
    email: userState.email,
    sessionId,
    resendAvailableAt,
    returnTo,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await getUserSessionFromCookie(request);
  const userState = user.get('state');
  const returnTo = getReturnTo(request.url);

  if (!userState) {
    return redirect(buildLoginRedirect(returnTo));
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'request') {
    const { sessionId, resendAvailableAt } = await requestEmailVerification(
      userState.sub,
    );

    return data<EmailVerificationActionData>({
      intent: 'request',
      sessionId,
      resendAvailableAt,
    });
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

    return redirect(returnTo);
  }

  throw new Response('Bad Request', { status: 400 });
};

// The loader sends a fresh OTP every time it runs (see "Fire off the first
// OTP email immediately" above). React Router revalidates loaders after any
// action by default, so without this the verify/resend actions would each
// trigger a second, silent resend that invalidates the session the user is
// acting on. Only skip revalidation for our own POST submissions - other
// triggers (e.g. a fresh navigation to this route) should still load normally.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (formMethod) return false;
  return defaultShouldRevalidate;
};

function ResendButton({
  resendAvailableAt,
  pending,
  onResend,
}: {
  resendAvailableAt: number;
  pending: boolean;
  onResend: () => void;
}) {
  const remainingMs = useCountdown(resendAvailableAt);
  const onCooldown = remainingMs > 0;

  return (
    <Button
      variant="outline"
      type="button"
      size="xs"
      disabled={pending || onCooldown}
      onClick={onResend}
    >
      {pending
        ? 'Sending...'
        : onCooldown
          ? `Resend code in ${format(remainingMs, 'mm:ss')}`
          : 'Resend code'}
    </Button>
  );
}

function EmailVerificationPage({
  loaderData,
}: {
  loaderData: EmailVerificationLoaderData;
}) {
  const { email } = loaderData;
  const actionData = useActionData<EmailVerificationActionData>();
  const navigation = useNavigation();
  const resendFetcher = useFetcher<EmailVerificationActionData>();

  const isVerifying = navigation.state === 'submitting';
  const isResending = resendFetcher.state !== 'idle';

  const handleResend = () => {
    resendFetcher.submit({ intent: 'request' }, { method: 'post' });
  };

  const sessionId =
    resendFetcher.data?.intent === 'request'
      ? resendFetcher.data.sessionId
      : actionData?.intent === 'verify'
        ? actionData.sessionId
        : loaderData.sessionId;

  const resendAvailableAt =
    resendFetcher.data?.intent === 'request'
      ? resendFetcher.data.resendAvailableAt
      : loaderData.resendAvailableAt;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <Form method="post">
            <CardHeader>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>
                {email
                  ? `We sent a verification code to ${email}.`
                  : 'Confirm your email address to secure your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <input type="hidden" name="intent" value="verify" />
              <input type="hidden" name="sessionId" value={sessionId} />
              <FieldGroup>
                <Field>
                  <InputOTP
                    id="otp"
                    name="otp"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                  >
                    <InputOTPGroup className="w-full *:data-[slot=input-otp-slot]:aspect-square *:data-[slot=input-otp-slot]:h-auto *:data-[slot=input-otp-slot]:w-1/6 *:data-[slot=input-otp-slot]:text-xl">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <FieldDescription>
                    <div className="flex items-center justify-center gap-2">
                      <span>Didn't receive the code?</span>
                      <ResendButton
                        resendAvailableAt={resendAvailableAt}
                        pending={isResending}
                        onResend={handleResend}
                      />
                    </div>
                  </FieldDescription>
                </Field>
                {actionData?.intent === 'verify' && !actionData.verified && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{actionData.error}</AlertTitle>
                  </Alert>
                )}
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-center">
              <Field>
                <Button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full"
                  size="lg"
                >
                  Verify
                </Button>
              </Field>
            </CardFooter>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
