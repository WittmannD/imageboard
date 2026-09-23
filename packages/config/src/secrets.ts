import { z } from 'zod';

const secret = z.string().min(1);

/*
 * Secrets never live in the profiles: they come from the environment (the root
 * .env file, see .env.example). Each service declares only the ones it needs
 * and fails fast at startup when any of them is missing.
 */

export const apiSecrets = z.object({
  DB_USER: secret,
  DB_PASS: secret,
});

export const identityProviderSecrets = z.object({
  DB_USER: secret,
  DB_PASS: secret,
  SMTP_USER: secret,
  SMTP_PASS: secret,
  OIDC_CLIENT_SECRET: secret,
  // Base64-encoded 32-byte AES-256 key used to encrypt JWKS private key
  // material at rest in Postgres. Generate with: openssl rand -base64 32
  JWKS_ENCRYPTION_KEY: secret,
});

export const clientSecrets = z.object({
  OIDC_CLIENT_SECRET: secret,
  SESSION_COOKIE_SECRET: secret,
});

export const imageProcessorSecrets = z.object({
  S3_ACCESS_KEY_ID: secret,
  S3_SECRET_ACCESS_KEY: secret,
});

export type ApiSecrets = z.infer<typeof apiSecrets>;
export type IdentityProviderSecrets = z.infer<typeof identityProviderSecrets>;
export type ClientSecrets = z.infer<typeof clientSecrets>;
export type ImageProcessorSecrets = z.infer<typeof imageProcessorSecrets>;

/** Reads the secrets `schema` declares from `env`, reporting every missing name at once. */
export function loadSecrets<T extends z.ZodObject>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const names = new Set(
      result.error.issues.map((issue) => issue.path.join('.')),
    );

    throw new Error(
      `Missing or invalid secrets in the environment: ${[...names].join(', ')}`,
    );
  }

  return result.data;
}
