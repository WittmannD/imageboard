import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { parseEnv } from 'node:util';

import { getConfig } from '@hdotu1/config';

/**
 * Where the e2e stack lives, taken from the same `e2e` configuration profile
 * the stack itself runs with (packages/config), so the two cannot disagree.
 *
 * The apps inside Docker only ever see port-less URLs on `http://<domain>`;
 * the browser reaches them through Chromium's `--host-resolver-rules`, which
 * maps those hostnames to the published host ports below. This is what keeps
 * the OIDC issuer, redirect URI and cookies identical for the browser and for
 * the containers talking to each other.
 */
const config = getConfig('e2e');
const { domain } = config;

if (!config.e2e) {
  throw new Error('The e2e profile must declare its host ports (`e2e`).');
}

const { httpPort, s3Port, mailpitPort } = config.e2e;

/** The stack's test-only secrets, shared with docker-compose.e2e.yaml. */
const secrets = parseEnv(
  readFileSync(path.resolve(import.meta.dirname, '../.env.e2e'), 'utf8'),
);

const imageHost = new URL(config.urls.imageServer).hostname;

export const env = {
  domain,
  httpPort,
  s3Port,
  mailpitPort,

  baseUrl: config.urls.web,
  authHost: new URL(config.urls.auth).hostname,
  apiHost: new URL(config.urls.api).hostname,
  imageHost,
  /** Public-read bucket URL the client renders <img> tags from. */
  imageServerUrl: config.urls.imageServer,

  mailpitUrl: `http://127.0.0.1:${mailpitPort}`,

  /**
   * The e2e client's credentials. Only needed to call the provider's token
   * endpoint the way the client's server does, e.g. to check whether a
   * refresh token still works.
   */
  oidcClientId: config.identityProvider.oidc.client.id,
  oidcClientSecret: secrets['OIDC_CLIENT_SECRET'] ?? '',

  /**
   * Chromium applies the first matching rule. The image host keeps the port
   * from its URL (MinIO), everything else is redirected to nginx.
   */
  hostResolverRules: [
    `MAP ${imageHost} 127.0.0.1`,
    `MAP ${domain} 127.0.0.1:${httpPort}`,
    `MAP *.${domain} 127.0.0.1:${httpPort}`,
  ].join(','),
} as const;
