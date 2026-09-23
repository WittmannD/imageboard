import type { AppConfig } from './schema.js';

/**
 * The flat KEY=value view of the configuration for consumers that cannot
 * import TypeScript: docker compose interpolation and the nginx template.
 */
export function toComposeEnv(config: AppConfig): Record<string, string> {
  const env: Record<string, string> = {
    APP_ENV: config.env,
    DOMAIN: config.domain,
    DB_NAMES: `${config.database.names.api}, ${config.database.names.identity}`,
    DB_NAME_API: config.database.names.api,
    DB_PORT: String(config.database.port),
    REDIS_PORT: String(config.redis.port),
    API_INTERNAL_URL: config.urls.internal.api,
    CLIENT_INTERNAL_URL: config.urls.internal.client,
    AUTH_SERVER_INTERNAL_URL: config.urls.internal.identityProvider,
    API_PORT: String(config.api.port),
    IDP_PORT: String(config.identityProvider.port),
    CLIENT_PORT: String(config.client.port),
    IDP_DEBUG: config.identityProvider.debug,
    S3_BUCKET: config.imageProcessor.s3.bucket,
  };

  if (config.e2e) {
    env['E2E_HTTP_PORT'] = String(config.e2e.httpPort);
    env['E2E_S3_PORT'] = String(config.e2e.s3Port);
    env['E2E_MAILPIT_PORT'] = String(config.e2e.mailpitPort);
  }

  return env;
}

/** Serializes `env` in the dotenv format docker compose's --env-file reads. */
export function formatEnvFile(env: Record<string, string>): string {
  const lines = Object.entries(env).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`,
  );

  return `${lines.join('\n')}\n`;
}
