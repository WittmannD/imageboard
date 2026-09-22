import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircleIcon } from 'lucide-react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router';
import React, { useCallback, useState } from 'react';
import { z } from 'zod';

import { Alert, AlertDescription } from 'src/components/ui/alert/Alert.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
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
import { forgotPasswordFormSchema } from 'src/components/features/forms/forgot-password/schema.ts';
import { getApiErrorCode } from 'src/lib/utils/api-error.ts';
import { useRequestPasswordResetMutation } from 'src/services/api/auth/api.ts';

const FORGOT_PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: 'Please enter a valid email address.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
};

function getErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);

  return (
    (code && FORGOT_PASSWORD_ERROR_MESSAGES[code]) ??
    'Something went wrong. Please try again.'
  );
}

export function ForgotPasswordForm(props: React.ComponentProps<typeof Card>) {
  const [requestReset] = useRequestPasswordResetMutation();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordFormSchema>>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = useCallback<
    SubmitHandler<z.output<typeof forgotPasswordFormSchema>>
  >(
    async (data) => {
      try {
        await requestReset(data).unwrap();
        setSentTo(data.email);
      } catch (error) {
        form.setError('root', { message: getErrorMessage(error) });
      }
    },
    [requestReset, form],
  );

  if (sentTo) {
    // Same screen whether or not the address has an account - the server
    // doesn't say, and neither should this page.
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for {sentTo}, we've sent a link to reset
            its password. The link can only be used once and expires soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldDescription className="text-center">
            <Link to="/auth/login">Back to login</Link>
          </FieldDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we will send you a link to reset it
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
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    aria-invalid={fieldState.invalid}
                    data-testid="forgot-password-email-input"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                data-testid="forgot-password-submit"
              >
                {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
              <FieldDescription className="text-center">
                Remembered it? <Link to="/auth/login">Back to login</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
