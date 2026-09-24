import type { ProfileOverrides } from '../schema.js';

const domain = 'e2e.test';
const s3Port = 9000;

/**
 * The self-contained Playwright stack (apps/imageboard-e2e/docker-compose.e2e.yaml).
 * SMTP is faked by Mailpit and S3 by MinIO.
 */
export const e2e: ProfileOverrides = {
  env: 'e2e',
  domain,
  // Public-read MinIO bucket the client renders <img> tags from.
  imageServerUrl: `http://s3.${domain}:${s3Port}/imageboard`,

  // Every request reaches the services from the client container's one IP, so
  // the per-IP rate limits cannot work for a test run.
  throttle: { enabled: false },
  database: {
    seed: true,
  },
  identityProvider: {
    smtp: {
      host: 'mailpit',
      port: 1025,
      secure: false,
      from: `Imageboard <no-reply@${domain}>`,
    },
    oidc: {
      client: { id: 'imageboard-e2e-client' },
    },
  },

  client: {
    sessionMaxAgeSec: 24 * 60 * 60, // 1 day
  },

  imageProcessor: {
    s3: {
      endpoint: 'http://minio:9000',
      region: 'us-east-1',
      forcePathStyle: true,
    },
  },

  // Host ports, chosen so the stack can share a machine with the dev stack,
  // which already owns host port 80.
  e2e: {
    httpPort: 8088,
    s3Port,
    mailpitPort: 8025,
  },
};
