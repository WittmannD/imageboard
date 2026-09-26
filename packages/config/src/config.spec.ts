import { describe, expect, it } from 'vitest';

import { toComposeEnv } from './compose-env.js';
import { getConfig, resolveAppEnv } from './get-config.js';
import { toPublicConfig } from './public.js';
import { APP_ENVS } from './schema.js';
import { clientSecrets, loadSecrets } from './secrets.js';

describe('getConfig', () => {
  it.each(APP_ENVS)('resolves the %s profile', (env) => {
    const config = getConfig(env);

    expect(config.env).toBe(env);
    expect(Object.isFrozen(config.identityProvider.oidc)).toBe(true);
  });

  it('derives every URL from the domain', () => {
    const { urls } = getConfig('e2e');

    expect(urls).toMatchObject({
      web: 'http://e2e.test',
      apiProxy: 'http://e2e.test/api',
      api: 'http://api.e2e.test',
      auth: 'http://auth.e2e.test',
      interactions: 'http://e2e.test/auth/',
      imageServer: 'http://s3.e2e.test:9000/imageboard',
      oidcRedirectUris: ['http://e2e.test/auth/callback'],
      oidcPostLogoutRedirectUris: ['http://e2e.test/'],
      internal: {
        api: 'http://imageboard-api:3000',
        identityProvider: 'http://imageboard-identity-provider:3001',
        client: 'http://imageboard-client:5734',
      },
    });
  });

  it('serves staging over https and keeps its data', () => {
    const staging = getConfig('staging');

    expect(staging.urls).toMatchObject({
      web: 'https://staging.spottish.website',
      api: 'https://api.staging.spottish.website',
      auth: 'https://auth.staging.spottish.website',
      oidcRedirectUris: ['https://staging.spottish.website/auth/callback'],
    });
    expect(staging.database).toMatchObject({ dropSchema: false, seed: true });
  });

  it('merges profile overrides into the base profile', () => {
    const development = getConfig('development');
    const e2e = getConfig('e2e');

    expect(development.throttle.enabled).toBe(true);
    expect(e2e.throttle.enabled).toBe(false);
    // Overriding one SMTP field keeps the rest of the block from base.
    expect(e2e.identityProvider.smtp.port).toBe(1025);
    expect(e2e.identityProvider.oidc.client.name).toBe('Imageboard');
    expect(development.urls.oidcRedirectUris).toContain(
      'http://localhost:5173/auth/callback',
    );
  });

  it('rejects an unknown APP_ENV', () => {
    expect(() => resolveAppEnv('qa')).toThrow(/Unknown APP_ENV "qa"/);
    expect(resolveAppEnv('')).toBe('development');
  });
});

describe('loadSecrets', () => {
  it('returns only the declared secrets', () => {
    expect(
      loadSecrets(clientSecrets, {
        OIDC_CLIENT_SECRET: 'a',
        SESSION_COOKIE_SECRET: 'b',
        DB_PASS: 'c',
      }),
    ).toEqual({ OIDC_CLIENT_SECRET: 'a', SESSION_COOKIE_SECRET: 'b' });
  });

  it('names every missing secret', () => {
    expect(() => loadSecrets(clientSecrets, { OIDC_CLIENT_SECRET: '' })).toThrow(
      'Missing or invalid secrets in the environment: OIDC_CLIENT_SECRET, SESSION_COOKIE_SECRET',
    );
  });
});

describe('toPublicConfig', () => {
  it('exposes only browser-safe URLs', () => {
    expect(toPublicConfig(getConfig('e2e'))).toEqual({
      webUrl: 'http://e2e.test',
      apiBaseUrl: 'http://e2e.test/api',
      oidcIssuerUrl: 'http://auth.e2e.test',
      imageServerUrl: 'http://s3.e2e.test:9000/imageboard',
    });
  });
});

describe('toComposeEnv', () => {
  it('only emits e2e host ports for the e2e profile', () => {
    expect(toComposeEnv(getConfig('e2e'))).toMatchObject({
      APP_ENV: 'e2e',
      DOMAIN: 'e2e.test',
      DB_NAMES: 'imageboard, imageboard_identity',
      E2E_HTTP_PORT: '8088',
    });
    expect(toComposeEnv(getConfig('production'))).not.toHaveProperty(
      'E2E_HTTP_PORT',
    );
  });
});
