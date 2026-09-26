import { z } from 'zod';

export const APP_ENVS = ['development', 'e2e', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

const mimeTypeRegex = /^[a-z0-9-]+\/[a-z0-9-+.]+$/i;
const imageFileFormats = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'bmp',
  'avif',
];
const port = z.number().int().min(1).max(65_535);
const positiveInt = z.number().int().positive();
const mime = z.string().regex(mimeTypeRegex);
const imageFileFormat = z.enum(imageFileFormats);
const url = z.url();

/** A @nestjs/throttler limit: at most `limit` requests per `ttl` milliseconds. */
const throttle = z.object({ ttl: positiveInt, limit: positiveInt });
export type ThrottleLimit = z.infer<typeof throttle>;

/**
 * Everything a profile declares. URLs that follow from `domain` are not part of
 * it - they are derived (see derive.ts), so they can never drift apart.
 */
export const profileSchema = z.object({
  env: z.enum(APP_ENVS),

  /** Public domain; the client lives on it, the API on api.<domain>, the IdP on auth.<domain>. */
  domain: z.string().min(1),
  scheme: z.enum(['http', 'https']),

  /** Public base URL browsers load processed images from (the S3 bucket). */
  imageServerUrl: url,

  throttle: z.object({
    /** Per-IP rate limits. Off for e2e runs, where every request shares one client IP. */
    enabled: z.boolean(),
  }),

  redis: z.object({
    host: z.string().min(1),
    port,
  }),

  database: z.object({
    host: z.string().min(1),
    port,
    ssl: z.boolean(),
    dropSchema: z.boolean(),
    synchronize: z.boolean(),
    names: z.object({
      api: z.string().min(1),
      identity: z.string().min(1),
    }),
    seed: z.boolean(),
  }),

  storage: z.object({
    /** Volume shared by the API (upload destination) and the image processor (source files). */
    sharedPath: z.string().min(1),
  }),

  api: z.object({
    port,
    /** Hostname on the internal Docker network. */
    internalHost: z.string().min(1),
    throttle: z.object({
      default: throttle,
      createPost: throttle,
    }),
  }),

  identityProvider: z.object({
    port,
    internalHost: z.string().min(1),
    /** Value of the DEBUG env var the `debug` library reads, e.g. `oidc-provider*`. */
    debug: z.string(),
    pwHashSaltRounds: positiveInt,
    verification: z.object({
      sessionTtlMs: positiveInt,
      resendCooldownMs: positiveInt,
      otpSaltRounds: positiveInt,
    }),
    passwordReset: z.object({
      tokenTtlMs: positiveInt,
      requestCooldownMs: positiveInt,
    }),
    smtp: z.object({
      host: z.string().min(1),
      port,
      /** Implicit TLS; false for plain-SMTP catchers (Mailpit). */
      secure: z.boolean(),
      from: z.string().min(1),
    }),
    oidc: z.object({
      client: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        /** Registered on top of the derived `<web>/auth/callback`. */
        extraRedirectUris: z.array(url),
        /** Registered on top of the derived `<web>/`. */
        extraPostLogoutRedirectUris: z.array(url),
      }),
      /** oidc-provider token and session lifetimes, in seconds. */
      ttl: z.object({
        accessToken: positiveInt,
        authorizationCode: positiveInt,
        backchannelAuthenticationRequest: positiveInt,
        clientCredentials: positiveInt,
        deviceCode: positiveInt,
        idToken: positiveInt,
        interaction: positiveInt,
        preAuthorizedCode: positiveInt,
        refreshToken: positiveInt,
        grant: positiveInt,
        session: positiveInt,
      }),
    }),
    throttle: z.object({
      default: throttle,
      login: throttle,
      registration: throttle,
      emailVerification: throttle,
      verificationComplete: throttle,
      passwordResetRequest: throttle,
      passwordResetComplete: throttle,
      oidc: throttle,
      consent: throttle,
    }),
  }),

  client: z.object({
    port,
    internalHost: z.string().min(1),
    /** Max age of the OIDC and user session cookies, in seconds. */
    sessionMaxAgeSec: positiveInt,
  }),

  imageProcessor: z.object({
    /** How long the API waits for an image-processing RPC reply before giving up. */
    timeoutMs: positiveInt,
    s3: z.object({
      endpoint: url,
      region: z.string().min(1),
      /** Path-style addressing (http://host/bucket/key), required by MinIO. */
      forcePathStyle: z.boolean(),
      bucket: z.string().min(1),
    }),
  }),

  post: z.object({
    maxImagesPerPost: positiveInt,
    imageSizeLimitBytes: positiveInt,
    allowedImageMimeTypes: z.array(mime),
    allowedImageFormats: z.array(imageFileFormat),
  }),

  user: z.object({
    avatarSizeLimitBytes: positiveInt,
    allowedAvatarMimeTypes: z.array(mime),
    allowedAvatarFormats: z.array(imageFileFormat),
  }),

  /** Host ports the e2e stack publishes; only the e2e profile sets them. */
  e2e: z
    .object({
      httpPort: port,
      s3Port: port,
      mailpitPort: port,
    })
    .optional(),
});

export type Profile = z.infer<typeof profileSchema>;

type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** What a single profile file may override on top of the base profile. */
export type ProfileOverrides = DeepPartial<Profile> & Pick<Profile, 'env'>;

export interface Urls {
  /** The client: `<scheme>://<domain>`. */
  web: string;
  /** The client's same-origin proxy to the API, used by the browser. */
  apiProxy: string;
  /** The API; doubles as the OIDC resource indicator and the access token `aud`. */
  api: string;
  /** The OIDC issuer (identity provider). */
  auth: string;
  /** Where the IdP sends users for login/consent. Trailing slash matters: the provider resolves `login` against it. */
  interactions: string;
  imageServer: string;
  oidcRedirectUris: string[];
  oidcPostLogoutRedirectUris: string[];
  /** Service URLs on the internal Docker network (used by nginx). */
  internal: {
    api: string;
    identityProvider: string;
    client: string;
  };
}

export type AppConfig = Profile & { urls: Urls };
