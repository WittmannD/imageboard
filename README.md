# Imageboard

A full-stack image board: users sign up, upload photo sets, and browse a feed where every
post is rendered as an automatically composed photo collage.

The project is built as a TypeScript monorepo of five deployable apps and eight shared
packages. Its two distinguishing pieces are a **standalone OpenID Connect provider** (the
project runs its own identity server rather than delegating to a SaaS) and an
**asynchronous image-processing pipeline** in which a layout engine decides the geometry of
a post's collage *before* a dedicated microservice renders each image variant to exactly
that geometry.

---

## Architecture

```
                         ┌────────────────────────────┐
  browser  ──── 80/443 ──│  imageboard-web  (nginx)   │
                         │  spottish.website          │
                         │  api.*   auth.*            │
                         └──┬─────────┬───────────────┘
                            │         │            
            ┌───────────────▼──┐  ┌───▼─────────┐  
            │ imageboard-client│  │ imageboard- │  
            │ React Router SSR │  │ api (Nest)  │  
            │ OIDC RP, cookies │  │ REST + JWT  │  
            └───────┬──────────┘  └───┬───────┬─┘  
                    │  auth code      │       │     
                    │  + PKCE         │       │ Redis RPC
            ┌───────▼─────────────────▼──┐ ┌──▼──────────────┐
            │ imageboard-identity-       │ │ image-processor │
            │ provider (oidc-provider)   │ │ sharp + YAML    │
            └───────┬──────────────┬─────┘ └────┬────────────┘
                    │              │            │
              ┌─────▼──────┐  ┌────▼────┐  ┌────▼─────────────┐
              │ PostgreSQL │  │ Redis   │  │ S3 (Filebase)    │
              │ 2 databases│  │ session │  │ image variants   │
              └────────────┘  └─────────┘  └──────────────────┘
```

### The upload pipeline

This is the heart of the project and worth reading end to end:

1. `POST /posts` accepts up to 3 images through multer, which writes them to a **shared
   volume** under a generated UUID. A `PostEntity` (`Draft`) and its `PhotoEntity` rows
   (`Processing`) are saved in one transaction, and the draft is returned to the client
   immediately.
2. The processing work is **not awaited** — it is kicked off as an RxJS stream in its own
   transaction, so the HTTP request never blocks on image encoding.
3. `@hdotu1/gallery-layout-engine` reads each image's intrinsic dimensions and runs a
   solver: every registered collage template that can fit the image count proposes a
   layout, each layout is scored by weighted penalty functions (e.g. a crop penalty using
   the log-ratio between original and target aspect), and the best-scoring layout wins.
   The result is a set of tiles with concrete `width` / `height` / `row` / `column` / span.
4. For each tile the API sends an `image.from_config` message over a **custom Redis
   transport** (`@hdotu1/redis-transport`, a hand-written NestJS `Server` / `ClientProxy`
   pair on top of `@redis/client`) to the `image-processor` service, passing the tile as
   template variables.
5. `image-processor` streams the source file out of the shared volume, peeks its metadata,
   and resolves a **YAML transform config** — `${{variables.tile.width}}`, `${{file.name}}`
   and friends are interpolated by `@hdotu1/yaml-template` (mustache + AJV schema
   validation). Each pipeline is a list of `sharp` operations (`resize`, `extract`,
   `extend`, `trim`, `jpeg` / `png` / `webp` / `avif`, `save`) executed as a stream,
   emitting one output event per `save`.
6. Outputs are uploaded to S3-compatible object storage through `@hdotu1/media-storage`
   and returned as `ImageOutput[]` (key, format, size, dimensions, custom metadata).
7. The API writes that source-set onto the photo (`Ready`), and once every photo resolves
   the post flips to `Published` and appears in the feed.

Because tile geometry is baked into the render, the client can lay out a collage from the
`metadata.tile` of each variant without any client-side measurement.

### Authentication

`imageboard-identity-provider` is a real OIDC authorization server built on `oidc-provider`
and wrapped in NestJS:

- Authorization Code flow with **PKCE**, `offline_access` refresh tokens with rotation, and
  JWT access tokens scoped to the API through **resource indicators**.
- Custom interaction endpoints (login, registration, email verification) that hand control
  back to the provider — the interaction *UI* lives in the React app, the IdP only
  redirects to it.
- **JWKS keys are stored in Postgres and encrypted at rest with AES-256**; sessions, grants
  and OTP sessions live in Redis via Keyv.
- Credentials are bcrypt-hashed and kept in a separate table from user records, in a
  separate database from the application data.
- Registration and verification responses are deliberately **enumeration-resistant**: a
  collision on email proceeds with a throwaway `untrusted-*` account id, so a caller cannot
  distinguish "taken" from "created".

`imageboard-client` is the relying party — the entire OIDC exchange (PKCE verifier, code
exchange, refresh, userinfo) happens in React Router's server layer, and only an encrypted
session cookie reaches the browser. `imageboard-api` never sees a password: it verifies the
access token against the IdP's JWKS with `jose` and maps the `iss` / `sub` pair to a local
user through a `FederatedCredentials` table, provisioning the user on first sight.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Language / tooling | TypeScript 6 (strict, NodeNext ESM), Node 22, Nx 21 + npm workspaces, SWC, ESLint 9, Prettier, Vitest |
| Backend | NestJS 11, TypeORM 0.3, PostgreSQL 18, Redis 7, `@nestjs/microservices`, `@nestjs/throttler`, class-validator / class-transformer |
| Identity | `oidc-provider` 9, `jose`, bcrypt, Keyv (+ Redis), Nodemailer |
| Images | `sharp`, `image-size`, AWS SDK v3 (S3 / Filebase), js-yaml + mustache + AJV |
| Frontend | React 19, React Router 8 (SSR framework mode), Redux Toolkit + RTK Query, Base UI, Tailwind CSS 4, react-hook-form + Zod, Embla Carousel, lucide-react, axios |
| Infrastructure | Docker Compose, nginx reverse proxy, GitHub Actions → GHCR → VPS |

## Repository layout

### Apps

| App | Description |
| --- | --- |
| `imageboard-api` | NestJS REST API — posts, photos, users, avatars, OIDC token verification, keyset pagination |
| `imageboard-identity-provider` | OpenID Connect authorization server: registration, email OTP verification, JWKS management |
| `imageboard-client` | React Router SSR app — feed, post lightbox, profiles, settings, auth screens; acts as the OIDC relying party |
| `image-processor` | Headless microservice consuming Redis messages and running configurable `sharp` pipelines |
| `imageboard-web` | nginx container that terminates traffic and routes `spottish.website`, `api.*` and `auth.*` to the right service |
| `imageboard-e2e` | Playwright end-to-end tests that drive the full stack in a real browser — see [its README](./apps/imageboard-e2e/README.md) |

### Packages

| Package | Description |
| --- | --- |
| `@hdotu1/gallery-layout-engine` | Dependency-free collage solver: templates, tiles, weighted penalty scoring, fallback template |
| `@hdotu1/media-storage` | Storage abstraction with local-filesystem and S3 drivers, signed URLs and typed error mapping |
| `@hdotu1/redis-transport` | Custom NestJS microservice transport (server + client proxy) backed by `@redis/client` |
| `@hdotu1/yaml-template` | YAML loader with `${{ }}` value interpolation and JSON-schema validation |
| `@hdotu1/image-processor-contract` | Shared DTOs and message patterns between the API and the processor |
| `@hdotu1/image-processor-client` | Injectable NestJS client for the processor microservice |
| `@hdotu1/database-common` | `TransactionService` for composing TypeORM transactions across promises and observables |
| `@hdotu1/common` | Shared helpers and constants |

---

## Features

### Implemented

**Authentication & accounts**

- [x] Self-hosted OIDC provider: authorization code + PKCE, rotating refresh tokens, JWT access tokens with resource indicators
- [x] Email / password registration with bcrypt hashing and enumeration-resistant responses (the `login` endpoint exists on the provider, but see "Sign-in for returning users" below)
- [x] Email verification via OTP codes over SMTP, with resend cooldown and single-use sessions
- [x] JWKS persisted in Postgres and encrypted at rest; OIDC sessions and grants in Redis
- [x] Server-side OIDC flow in the SSR client with encrypted cookie sessions and transparent token refresh
- [x] API-side token verification against remote JWKS, plus automatic user provisioning through federated credentials
- [x] Per-endpoint rate limiting on the API and the identity provider

**Posts & images**

- [x] Create a post with a caption and up to 3 images
- [x] Asynchronous, non-blocking image processing with per-photo status tracking
- [x] Template-based collage layout engine with penalty scoring
- [x] Configurable `sharp` pipelines declared in YAML (resize, extract, extend, trim, jpeg / png / webp / avif, save)
- [x] Multiple render variants per image (`lightbox`, `tile`) uploaded to S3-compatible storage
- [x] Feed with keyset (cursor) pagination
- [x] Post lightbox view with a keyboard-navigable carousel

**Profiles & UI**

- [x] Public user profiles and an authenticated "me" profile
- [x] Avatar upload rendered into four sizes (`avatar`, `icon_large`, `icon_medium`, `icon_small`)
- [x] Username change with conflict handling
- [x] Component library on Base UI + Tailwind 4, light / dark theme toggle, drag-and-drop uploads, Zod-validated forms
- [x] URL-driven dialog manager with lazily loaded dialogs, and automatic redirect on `401`

**Infrastructure**

- [x] Full Docker Compose stack with health checks, hot-reload watch mode and a multi-database Postgres init script
- [x] nginx reverse proxy with per-subdomain routing and per-route upload limits
- [x] GitHub Actions pipeline: Nx affected lint / test / build, image push to GHCR, SSH deploy to a VPS

### In progress / planned

**API gaps**

- [ ] `GET /posts/:id` — the client currently resolves a single post by filtering the feed page client-side
- [ ] Posts-by-user endpoint — profile pages still render a hardcoded placeholder post
- [ ] Post editing, deletion and unpublishing (`PostStatus.Unpublished` exists but no endpoint uses it)
- [ ] Failure handling for the processing pipeline (`PhotoProcessingStatus.Failed` is never set; no retries or dead-lettering)

**Client gaps**

- [ ] Infinite scroll / "load more" in the feed — the API already returns a cursor, the UI ignores it
- [ ] Real profile statistics — the Posts / Likes counters are stubbed
- [ ] Wiring for the settings actions: change username, change password, resend verification

**Social features**

- [ ] Likes and comments (no persistence model yet)
- [ ] Follows and a personalized feed
- [ ] Search and tags

**Identity provider hardening**

- [ ] Sign-in for returning users — the client's login page renders the sign-up form and posts to the registration endpoint, so today a session can only be created by registering
- [ ] Google / social login (configuration placeholders exist, no implementation)
- [ ] Password reset flow
- [ ] Pairwise subject identifiers
- [ ] RP-initiated logout screens (`end_session` HTML sources)
- [ ] Restrict the authorization server to statically configured clients, and replace the permissive dev CORS setup

---

## Getting started

### Prerequisites

- Node.js >= 22
- Docker and Docker Compose
- An S3-compatible bucket (the deployment uses [Filebase](https://filebase.com)) and SMTP credentials

### Run the whole stack

```sh
# each app reads its own apps/<app>/.env, plus the root .env for shared DB/Redis values
docker compose up --build

# development with file syncing into the client container
docker compose watch
```

Compose brings up Postgres (with `imageboard` and `imageboard_identity` created by
`sh/multiple-databases.sh`), Redis, pgweb on `:8081`, the nginx front door on `:80`, and all
application containers.

### Work on a single workspace

```sh
npm ci

# build every package the apps depend on first
npx nx run-many -t build --projects="packages/*"

npx nx run imageboard-api:dev
npx nx run imageboard-client:dev
npx nx run image-processor:dev
npx nx run imageboard-identity-provider:dev
```

### Checks

```sh
npm run lint          # nx run-many -t=lint
npm run test          # nx run-many -t=test  (Vitest)
npm run build         # nx run-many -t=build
npx nx affected -t lint test build
```

End-to-end tests run against their own Docker stack and are not part of `npm run test`:

```sh
npm run stack:up -w imageboard-e2e   # build and start the stack
npm run e2e -w imageboard-e2e        # run Playwright
npm run stack:down -w imageboard-e2e
```

### Configuration

Each app is configured through its own `.env` file:

| File | Key variables |
| --- | --- |
| `.env` (root) | `DB_USER`, `DB_PASS`, `DB_PORT`, `REDIS_PORT` |
| `apps/imageboard-api/.env` | `BASE_URL`, `PORT`, `DB_*`, `REDIS_PORT`, `OIDC_ISSUER`, `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID` |
| `apps/imageboard-identity-provider/.env` | `ISSUER_URL`, `INTERACTIONS_BASE_URL`, `IMAGEBOARD_API_URL`, `OIDC_CLIENT_*`, `DB_*`, `SMTP_*`, `JWKS_ENCRYPTION_KEY` |
| `apps/imageboard-client/.env` | `VITE_BASE_URL`, `VITE_API_BASE_URL`, `VITE_IMAGE_SERVER_URL`, `OIDC_CLIENT_*`, `SESSION_COOKIE_SECRET`, `OIDC_SESSION_MAX_AGE` |
| `apps/image-processor/.env` | `REDIS_PORT`, `FILEBASE_KEY`, `FILEBASE_SECRET` |
| `apps/imageboard-web/.env` | `DOMAIN`, `API_INTERNAL_URL`, `CLIENT_INTERNAL_URL`, `AUTH_SERVER_INTERNAL_URL` |

`JWKS_ENCRYPTION_KEY` must be a base64-encoded 32-byte key — generate one with
`openssl rand -base64 32`.

---

## Notes

- The monorepo deliberately avoids NestJS monorepo mode: Nx sits on top of plain npm
  workspaces, so each app keeps its own `package.json`, Dockerfile and dependency graph, and
  `nx affected` only rebuilds what changed.
- Shared packages are consumed as `file:` workspace dependencies and expose `dist` for
  runtime with `src` for types, so editors resolve straight to source.
