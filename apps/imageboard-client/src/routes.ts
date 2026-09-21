import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

export default [
  layout('./routes/layout.tsx', [
    index('./routes/feed/index.tsx'),
    ...prefix('posts', [
      route('create', './routes/post/create/index.tsx'),
      route(':id', './routes/post/$id.tsx'),
    ]),
    ...prefix('users', [
      route(
        'email-verification',
        './routes/users/email-verification/index.tsx',
      ),
      ...prefix('me', [
        layout('./routes/users/me/layout.tsx', [
          index('./routes/users/me/index.tsx'),
          route('settings', './routes/users/me/settings.tsx'),
        ]),
      ]),
      route(':id', './routes/users/$id/index.tsx'),
    ]),
  ]),
  ...prefix('auth', [
    layout('./routes/auth/layout.tsx', [
      layout('./routes/auth/_/layout.tsx', [
        route('login', './routes/auth/_/login/index.tsx'),
        route('registration', './routes/auth/_/registration/index.tsx'),
      ]),
      route('callback', './routes/auth/callback/index.tsx'),
      route('error', './routes/auth/error/index.tsx'),
      route('logout', './routes/auth/logout/index.tsx'),
      route('forgot-password', './routes/auth/forgot-password/index.tsx'),
      route('reset-password', './routes/auth/reset-password/index.tsx'),
    ]),
  ]),
  route('api/*', './routes/api/$.tsx'),
] satisfies RouteConfig;
