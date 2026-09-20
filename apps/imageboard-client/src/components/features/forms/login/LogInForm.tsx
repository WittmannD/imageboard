import { AlertCircleIcon } from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from 'src/components/ui/alert/Alert.tsx';
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
  FieldGroup,
  FieldLabel,
} from 'src/components/ui/field/Field.tsx';
import { Input } from 'src/components/ui/input/Input.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { Link, useLocation } from 'react-router';
import React from 'react';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Incorrect email or password.',
  invalid_input: 'Please check your email and password and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
};

export function LogInForm({
  action,
  error,
  defaultEmail,
  ...props
}: React.ComponentProps<typeof Card> & {
  action: string;
  error?: string;
  defaultEmail?: string;
}) {
  const { search } = useLocation();

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} method="POST">
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>
                  {LOGIN_ERROR_MESSAGES[error] ??
                    'Something went wrong. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                defaultValue={defaultEmail}
                required
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" name="password" required />
            </Field>
            <Field>
              <Button type="submit">Login</Button>
              <Button variant="outline" type="button">
                Login with Google
              </Button>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{' '}
                <Link to={{ pathname: '/auth/registration', search }}>Sign up</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
