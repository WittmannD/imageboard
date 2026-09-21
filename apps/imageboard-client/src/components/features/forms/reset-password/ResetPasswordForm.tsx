import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircleIcon } from 'lucide-react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router';
import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import { Alert, AlertDescription } from 'src/components/ui/alert/Alert.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { buttonVariants } from 'src/components/ui/button/button-style.ts';
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from 'src/components/ui/field/Field.tsx';
import { Input } from 'src/components/ui/input/Input.tsx';
import { resetPasswordFormSchema } from 'src/components/features/forms/reset-password/schema.ts';
import { getApiErrorCode } from 'src/lib/utils/api-error.ts';
import { useResetPasswordMutation } from 'src/services/api/auth/api.ts';

const RESET_PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: 'Please check your new password and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
};

function getErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);

  return (
    (code && RESET_PASSWORD_ERROR_MESSAGES[code]) ??
    'Something went wrong. Please try again.'
  );
}

type Status = 'form' | 'done' | 'invalid';

export function ResetPasswordForm(props: React.ComponentProps<typeof Card>) {
  const [resetPassword] = useResetPasswordMutation();
  // `undefined` until the fragment has been read: the server never sees it, so
  // neither the server render nor the first client render can know the token.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [status, setStatus] = useState<Status>('form');

  const form = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token'));
    // Don't leave the token in the address bar, history entry or a bookmark.
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );
  }, []);

  const onSubmit = useCallback<
    SubmitHandler<z.output<typeof resetPasswordFormSchema>>
  >(
    async (data) => {
      if (!token) {
        return;
      }

      try {
        await resetPassword({ token, password: data.password }).unwrap();
        setStatus('done');
      } catch (error) {
        if (getApiErrorCode(error) === 'invalid_reset_token') {
          setStatus('invalid');
          return;
        }
        form.setError('root', { message: getErrorMessage(error) });
      }
    },
    [resetPassword, token, form],
  );

  if (token === undefined) {
    return null;
  }

  if (status === 'done') {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>
            Your password has been changed. Log in with your new password to
            continue.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            to="/auth/login"
            className={`${buttonVariants({ size: 'lg' })} w-full`}
          >
            Log in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (!token || status === 'invalid') {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Reset link invalid</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Links can only
            be used once.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            to="/auth/forgot-password"
            className={`${buttonVariants({ size: 'lg' })} w-full`}
          >
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          Enter a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <Input
                    {...field}
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Must be at least 8 characters long.
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirm-new-password">
                    Confirm new password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Resetting...'
                  : 'Reset password'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
