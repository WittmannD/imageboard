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
      route(
        'create',
        './routes/post/create/index.tsx'
      ),
      route(
        ':id',
        './routes/post/$id.tsx'
      )
    ]),
    ...prefix('profile', [
      route(
        'email-verification',
        './routes/profile/email-verification/index.tsx',
      ),
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
    ]),
  ]),
  route('api/*', './routes/api/$.tsx'),
] satisfies RouteConfig;
