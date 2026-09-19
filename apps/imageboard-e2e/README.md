# imageboard-e2e

[Playwright](https://playwright.dev) tests that drive the whole product through
a real browser: client, API, identity provider, image processor, Postgres,
Redis and nginx, wired together the way they are deployed.

Nothing between the browser and the database is mocked. The two external
services are replaced with local stand-ins:

| Production    | E2E stand-in                           | Why                                    |
| ------------- | -------------------------------------- | -------------------------------------- |
| SMTP          | [Mailpit](https://mailpit.axllent.org) | Tests read the OTP email from its API  |
| Filebase (S3) | [MinIO](https://min.io)                | Public-read bucket, same as production |

## Running

```sh
npm ci
npx playwright install chromium

# 1. build the shared packages the Docker images copy in (skip if unchanged)
npm run stack:prepare -w imageboard-e2e

# 2. build and start the stack (first run builds four images, so it is slow)
npm run stack:up -w imageboard-e2e

# 3. run the suite
npm run e2e -w imageboard-e2e
npm run e2e:ui -w imageboard-e2e         # interactive runner
npm run e2e:report -w imageboard-e2e     # open the last HTML report

# tear down (also deletes all state)
npm run stack:down -w imageboard-e2e
```

`stack:logs` and `stack:ps` are there for debugging. If the stack is not
reachable, the suite stops immediately with a message saying so.

The stack is a separate compose project (`imageboard-e2e`) with no fixed
container names and throwaway state, so it runs happily next to the dev stack
from the root `docker-compose.yaml`.

### Ports

| Port | Service                                   | Override           |
| ---- | ----------------------------------------- | ------------------ |
| 8088 | nginx front door (app, `api.*`, `auth.*`) | `E2E_HTTP_PORT`    |
| 8025 | Mailpit UI and API                        | `E2E_MAILPIT_PORT` |
| 9000 | MinIO (public image bucket)               | `E2E_S3_PORT`      |

Set the same variables for both `stack:up` and `e2e`. `E2E_DOMAIN` (default
`e2e.test`) changes the hostname everything is served from.

## How it works

**Hostnames.** The OIDC flow needs the issuer, redirect URI and cookies to look
identical to the browser and to the containers. So the apps only ever see
port-less URLs on `http://e2e.test`, `api.e2e.test` and `auth.e2e.test`.
Containers reach those through network aliases on the nginx service. The
browser reaches them because Playwright launches Chromium with
`--host-resolver-rules` mapping the hostnames to the published host port (see
`src/env.ts`). No hosts-file edits, and no need for port 80.

**Authentication.** `test` from `src/fixtures.ts` is signed in; `test` from
`@playwright/test` is anonymous.

- The identity provider currently has no sign-in for returning users (the login
  page renders the sign-up form), so the only way to get a session is to
  register. The signed-in fixture does exactly that, through the real UI,
  including verifying the emailed one-time code, once per worker.
- One user per worker, not one shared user: refresh tokens rotate, and workers
  refreshing the same session would invalidate each other.

**Isolation.** The feed and the mailbox are global, so every test uses unique
users (`src/support/user.ts`) and finds its own data. Nothing is reset between
tests, and tests may run in parallel.

**Waiting.** Posts are published asynchronously (layout, resize, upload).
Assert with `expect(...).toPass()` / web-first assertions, never fixed sleeps.

**Test images** are generated in code (`src/support/images.ts`); the repo's
`tests/images` folder is gitignored and outside the Docker context.

## Configuration the stack relies on

These are opt-in environment switches added to the apps for this stack. Their
defaults leave production behaviour unchanged.

| App                    | Variable                                                                                                   | Effect                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| identity provider, API | `THROTTLE_DISABLED=true`                                                                                   | Skips rate limiting. Requests all come from one container IP, so per-IP limits (e.g. 3 verification emails/min) can't hold for a test run |
| identity provider      | `SMTP_SECURE=false`                                                                                        | Plain SMTP instead of implicit TLS, for Mailpit                                                                                           |
| image-processor        | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_FORCE_PATH_STYLE`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Point at any S3-compatible store (falls back to Filebase and `FILEBASE_*`)                                                                |
| client image           | `VITE_BASE_URL`, `VITE_API_BASE_URL`, `VITE_IMAGE_SERVER_URL` build args                                   | Vite inlines these at build time                                                                                                          |

## Layout

```
docker-compose.e2e.yaml   the stack
playwright.config.ts
src/
  env.ts                  hostnames, ports, Chromium host-resolver rules
  fixtures.ts             signed-in `test`, per-worker account
  global-setup.ts         fail-fast readiness check
  support/                mailpit, generated images, users, sign-up flow, polling
tests/
  auth/                   registration, protected routes
  posts/                  create a post and see it in the feed
```

## Parked

`registration › after signing up the visitor lands back on the page they asked
for` is marked `test.fixme`. It caught a real, intermittent app bug: `useAuth()`
in the client calls `navigate()` with an absolute URL, which React Router
resolves relative to the current route, racing the 401 handler and corrupting
`returnTo`. The cause and the one-line fix are in the comment inside the test;
delete the `test.fixme` line once it is fixed.

## Not covered yet

- Sign-in for returning users, once the login form exists.
- Post lightbox, avatar upload and username change.
- Token refresh (needs a short access-token TTL that the identity provider
  doesn't expose yet) and API failure states via `page.route`.
