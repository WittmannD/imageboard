import { AlertCircleIcon } from 'lucide-react';
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
  FieldGroup,
  FieldLabel,
} from 'src/components/ui/field/Field.tsx';
import { Input } from 'src/components/ui/input/Input.tsx';
import React from 'react';
import { Link, useLocation } from 'react-router';

const REGISTRATION_ERROR_MESSAGES: Record<string, string> = {
  username_taken: 'That username is already taken.',
  invalid_input: 'Please check your details and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
};

export function SignUpForm({
  action,
  error,
  defaultEmail,
  defaultUsername,
  ...props
}: React.ComponentProps<typeof Card> & {
  action: string;
  error?: string;
  defaultEmail?: string;
  defaultUsername?: string;
}) {
  const { search } = useLocation();

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} method="POST">
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>
                  {REGISTRATION_ERROR_MESSAGES[error] ??
                    'Something went wrong. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="name">Username</FieldLabel>
              <Input
                id="name"
                type="text"
                name="username"
                defaultValue={defaultUsername}
                required
              />
            </Field>
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
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" name="password" required />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input id="confirm-password" type="password" required />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">Create Account</Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link to={{ pathname: '/auth/login', search }}>Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
