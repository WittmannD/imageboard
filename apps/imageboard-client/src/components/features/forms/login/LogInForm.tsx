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

export function LogInForm({
  action,
  ...props
}: React.ComponentProps<typeof Card> & { action: string }) {
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
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
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
