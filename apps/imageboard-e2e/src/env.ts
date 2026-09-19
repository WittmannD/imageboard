/**
 * Where the e2e stack lives. Everything is overridable so the suite can share a
 * machine with the regular dev stack (which already owns host port 80).
 *
 * The apps inside Docker only ever see port-less URLs on `http://<domain>`;
 * the browser reaches them through Chromium's `--host-resolver-rules`, which
 * maps those hostnames to the published host ports below. This is what keeps
 * the OIDC issuer, redirect URI and cookies identical for the browser and for
 * the containers talking to each other.
 */
const domain = process.env['E2E_DOMAIN'] ?? 'e2e.test';
const httpPort = Number(process.env['E2E_HTTP_PORT'] ?? 8088);
const s3Port = Number(process.env['E2E_S3_PORT'] ?? 9000);
const mailpitPort = Number(process.env['E2E_MAILPIT_PORT'] ?? 8025);

const imageHost = `s3.${domain}`;

export const env = {
  domain,
  httpPort,
  s3Port,
  mailpitPort,

  baseUrl: `http://${domain}`,
  authHost: `auth.${domain}`,
  apiHost: `api.${domain}`,
  imageHost,
  /** Public-read bucket URL the client renders <img> tags from. */
  imageServerUrl: `http://${imageHost}:${s3Port}/imageboard`,

  mailpitUrl: `http://127.0.0.1:${mailpitPort}`,

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
