import { deriveUrls } from './derive.js';
import { base } from './profiles/base.js';
import { development } from './profiles/development.js';
import { e2e } from './profiles/e2e.js';
import { production } from './profiles/production.js';
import { staging } from './profiles/staging.js';
import {
  APP_ENVS,
  type AppConfig,
  type AppEnv,
  type ProfileOverrides,
  profileSchema,
} from './schema.js';

const profiles: Record<AppEnv, ProfileOverrides> = {
  development,
  e2e,
  staging,
  production,
};

const cache = new Map<AppEnv, AppConfig>();

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Merges `override` into `target`: nested objects are merged, arrays and scalars replaced. */
function deepMerge(
  target: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;

    const current = result[key];
    result[key] =
      isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value)
        : value;
  }

  return result;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }

  return value;
}

/** The environment named by APP_ENV, `development` when unset. */
export function resolveAppEnv(value: string | undefined = process.env['APP_ENV']): AppEnv {
  // An empty APP_ENV (e.g. `APP_ENV=` in compose) counts as unset.
  const env = value === undefined || value === '' ? 'development' : value;

  if (!(APP_ENVS as readonly string[]).includes(env)) {
    throw new Error(
      `Unknown APP_ENV "${env}", expected one of: ${APP_ENVS.join(', ')}`,
    );
  }

  return env as AppEnv;
}

/**
 * The configuration of the given environment: the base profile merged with the
 * environment's profile, validated, with every URL derived from the domain.
 * Memoized and deeply frozen.
 */
export function getConfig(env: AppEnv = resolveAppEnv()): AppConfig {
  const cached = cache.get(env);

  if (cached) {
    return cached;
  }

  const merged = deepMerge(base, profiles[env]);
  const result = profileSchema.safeParse(merged);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid "${env}" configuration:\n${issues}`);
  }

  const config = deepFreeze({ ...result.data, urls: deriveUrls(result.data) });
  cache.set(env, config);

  return config;
}
