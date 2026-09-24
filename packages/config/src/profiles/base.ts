import type { Profile } from '../schema.js';

const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;

const MINUTE_IN_SEC = 60;
const HOUR_IN_SEC = 60 * MINUTE_IN_SEC;
const DAY_IN_SEC = 24 * HOUR_IN_SEC;

/**
 * Defaults shared by every environment. Profiles only override what differs,
 * everything else lives here.
 */
export const base: Omit<Profile, 'env' | 'domain' | 'imageServerUrl' | 'e2e'> = {
  scheme: 'http',

  throttle: { enabled: true },

  redis: { host: 'redis', port: 6379 },

  database: {
    host: 'postgres',
    port: 5432,
    ssl: false,
    dropSchema: true,
    synchronize: true,
    seed: false,
    names: { api: 'imageboard', identity: 'imageboard_identity' },
  },

  storage: { sharedPath: '/shared' },

  api: {
    port: 3000,
    internalHost: 'imageboard-api',
    throttle: {
      // General DoS/abuse protection applied to every endpoint that doesn't
      // override it with a stricter, endpoint-specific throttle below.
      default: { ttl: MINUTE_IN_MS, limit: 120 }, // 120 requests/min per IP
      // Creating a post accepts file uploads and does image processing, so it is
      // throttled well below the general default to limit storage/processing abuse.
      createPost: { ttl: MINUTE_IN_MS, limit: 10 }, // 10 attempts/min per IP
    },
  },

  identityProvider: {
    port: 3001,
    internalHost: 'imageboard-identity-provider',
    debug: '',
    pwHashSaltRounds: 10,
    verification: {
      sessionTtlMs: 15 * MINUTE_IN_MS,
      resendCooldownMs: MINUTE_IN_MS,
      otpSaltRounds: 8,
    },
    passwordReset: {
      tokenTtlMs: 30 * MINUTE_IN_MS,
      requestCooldownMs: MINUTE_IN_MS,
    },
    smtp: {
      host: 'smtp.resend.com',
      port: 2465,
      secure: true,
      from: 'onboarding@resend.dev',
    },
    oidc: {
      client: {
        id: 'client',
        name: 'Imageboard',
        extraRedirectUris: [],
        extraPostLogoutRedirectUris: [],
      },
      ttl: {
        accessToken: HOUR_IN_SEC, // 1 hour
        authorizationCode: MINUTE_IN_SEC, // 1 minute
        backchannelAuthenticationRequest: 10 * MINUTE_IN_SEC, // 10 minutes (upper bound for requested_expiry)
        clientCredentials: 10 * MINUTE_IN_SEC, // 10 minutes
        deviceCode: 10 * MINUTE_IN_SEC, // 10 minutes
        idToken: HOUR_IN_SEC, // 1 hour
        interaction: HOUR_IN_SEC, // 1 hour
        preAuthorizedCode: 10 * MINUTE_IN_SEC, // 10 minutes
        refreshToken: 21 * DAY_IN_SEC, // 21 days
        grant: 14 * DAY_IN_SEC, // 14 days
        session: 24 * HOUR_IN_SEC, // 24 hours
      },
    },
    // This is an identity provider: login/registration/OTP endpoints are the
    // primary credential-stuffing and enumeration attack surface, so they get
    // much tighter, endpoint-specific limits than the general default.
    throttle: {
      // General DoS/abuse protection for endpoints without a stricter throttle.
      default: { ttl: MINUTE_IN_MS, limit: 100 }, // 100 requests/min per IP
      // Brute-forcing a password against a known email.
      login: { ttl: MINUTE_IN_MS, limit: 5 }, // 5 attempts/min per IP
      // Mass/automated account creation.
      registration: { ttl: HOUR_IN_MS, limit: 10 }, // 10 attempts/hour per IP
      // Sending the verification OTP triggers an email - also guards against email-bombing a victim address.
      emailVerification: { ttl: MINUTE_IN_MS, limit: 3 }, // 3 attempts/min per IP
      // Guessing a 6-digit OTP; kept tight enough to make brute-forcing infeasible before the OTP session expires.
      verificationComplete: { ttl: MINUTE_IN_MS, limit: 5 }, // 5 attempts/min per IP
      // Requesting a reset triggers an email - also guards against email-bombing a victim address.
      passwordResetRequest: { ttl: MINUTE_IN_MS, limit: 3 }, // 3 attempts/min per IP
      // The token is 256 bits, so guessing is hopeless; this just bounds noise and hashing work.
      passwordResetComplete: { ttl: MINUTE_IN_MS, limit: 5 }, // 5 attempts/min per IP
      // oidc-provider's own routes (authorize, token, jwks, etc), mounted behind a single catch-all controller.
      oidc: { ttl: MINUTE_IN_MS, limit: 60 }, // 60 requests/min per IP
      // Answering the consent screen: only ever a human click, so this is generous - it just bounds noise.
      consent: { ttl: MINUTE_IN_MS, limit: 20 }, // 20 attempts/min per IP
    },
  },

  client: {
    port: 5734,
    internalHost: 'imageboard-client',
    sessionMaxAgeSec: HOUR_IN_SEC, // 1 hour
  },

  imageProcessor: {
    timeoutMs: 60_000, // 1 minute
    // Filebase, the production object store.
    s3: {
      endpoint: 'https://s3.filebase.io',
      region: 'auto',
      forcePathStyle: false,
      bucket: 'imageboard',
    },
  },

  post: {
    maxImagesPerPost: 5,
    allowedImageMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/avif',
    ],
    allowedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'avif'],
    imageSizeLimitBytes: 6291456, // 6MB
  },

  user: {
    allowedAvatarMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/avif',
    ],
    allowedAvatarFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'avif'],
    avatarSizeLimitBytes: 2097152, // 2MB
  },
};
