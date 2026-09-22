import { AlertCircleIcon, CheckIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription } from 'src/components/ui/alert/Alert.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';
import { describeScope } from 'src/components/features/forms/consent/scopes.ts';
import { getApiErrorCode } from 'src/lib/utils/api-error.ts';
import {
  useDenyConsentMutation,
  useGetConsentQuery,
  useGrantConsentMutation,
} from 'src/services/api/auth/api.ts';

const CONSENT_ERROR_MESSAGES: Record<string, string> = {
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
};

function getErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);

  return (
    (code && CONSENT_ERROR_MESSAGES[code]) ??
    'Something went wrong. Please try again.'
  );
}

function ConsentCard({
  title,
  description,
  children,
  ...props
}: React.ComponentProps<typeof Card> & {
  title: string;
  description?: string;
}) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle data-testid="consent-heading">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children}
    </Card>
  );
}

export function ConsentForm({
  uid,
  ...props
}: React.ComponentProps<typeof Card> & { uid: string }) {
  const { data, error: loadError, isLoading } = useGetConsentQuery({ uid });
  const [grant] = useGrantConsentMutation();
  const [deny] = useDenyConsentMutation();
  // Stays set after a successful answer: the browser is on its way to the
  // provider and the buttons shouldn't invite a second click meanwhile.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const answer = useCallback(
    async (submit: typeof grant | typeof deny) => {
      setSubmitting(true);
      setError(undefined);

      try {
        const { redirectTo } = await submit({ uid }).unwrap();
        window.location.href = redirectTo;
      } catch (error) {
        setSubmitting(false);
        setError(getErrorMessage(error));
      }
    },
    [uid],
  );

  if (isLoading) {
    return (
      <ConsentCard {...props} title="Just a moment" description="Loading the request..." />
    );
  }

  if (!data) {
    // The interaction is gone (expired, or opened twice): starting over
    // is the only way forward, and /auth/login does exactly that.
    const expired = getApiErrorCode(loadError) === 'invalid_interaction';

    return (
      <ConsentCard
        {...props}
        title={expired ? 'This request has expired' : 'Something went wrong'}
        description={
          expired
            ? 'Start signing in again to continue.'
            : 'We could not load this request. Please try again.'
        }
      >
        <CardFooter>
          <Link to="/auth/login" className="w-full">
            <Button className="w-full">Start over</Button>
          </Link>
        </CardFooter>
      </ConsentCard>
    );
  }

  const { client, account, scopes } = data;

  return (
    <ConsentCard
      {...props}
      title={`Allow ${client.name} to access your account?`}
      description={`You are signed in as ${account.email}.`}
    >
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{client.name} will be able to:</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {scopes.map((scope) => (
              <li key={scope} className="flex items-start gap-2">
                <CheckIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <span>{describeScope(scope)}</span>
              </li>
            ))}
          </ul>
        </div>
        {(client.policyUri ?? client.tosUri) && (
          <p className="text-muted-foreground text-xs">
            Review {client.name}&apos;s{' '}
            {client.tosUri && (
              <a className="underline" href={client.tosUri}>
                terms of service
              </a>
            )}
            {client.tosUri && client.policyUri && ' and '}
            {client.policyUri && (
              <a className="underline" href={client.policyUri}>
                privacy policy
              </a>
            )}
            .
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          disabled={submitting}
          onClick={() => void answer(grant)}
          data-testid="consent-allow"
        >
          Allow
        </Button>
        <Button
          className="w-full"
          variant="outline"
          disabled={submitting}
          onClick={() => void answer(deny)}
          data-testid="consent-deny"
        >
          Deny
        </Button>
      </CardFooter>
    </ConsentCard>
  );
}
