import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircleIcon } from 'lucide-react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import React, { useCallback } from 'react';
import { z } from 'zod';

import { Alert, AlertDescription } from 'src/components/ui/alert/Alert.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from 'src/components/ui/field/Field.tsx';
import { Input } from 'src/components/ui/input/Input.tsx';
import { getApiErrorCode } from 'src/lib/utils/api-error.ts';
import { loginFormSchema } from 'src/components/features/forms/login/schema.ts';
import { useLoginMutation } from 'src/services/api/auth/api.ts';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Incorrect email or password.',
  invalid_input: 'Please check your email and password and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
};

function getErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);

  return (
    (code && LOGIN_ERROR_MESSAGES[code]) ??
    'Something went wrong. Please try again.'
  );
}

export function LogInForm({
  uid,
  ...props
}: React.ComponentProps<typeof Card> & { uid: string }) {
  const { search } = useLocation();
  const [login] = useLoginMutation();

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = useCallback<SubmitHandler<z.output<typeof loginFormSchema>>>(
    async (data) => {
      try {
        const { redirectTo } = await login({ uid, ...data }).unwrap();
        window.location.href = redirectTo;
      } catch (error) {
        form.setError('root', { message: getErrorMessage(error) });
      }
    },
    [login, uid, form],
  );

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle data-testid="login-heading">Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
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
                    data-testid="login-email-input"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                      to="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      data-testid="login-forgot-password-link"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                    data-testid="login-password-input"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                data-testid="login-submit"
              >
                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{' '}
                <Link
                  to={{ pathname: '/auth/registration', search }}
                  data-testid="login-signup-link"
                >
                  Sign up
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
