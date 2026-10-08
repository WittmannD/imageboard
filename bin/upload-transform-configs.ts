/**
 * Uploads the transform configs of the image- and video-processor
 * (apps/<app>/config) to the root of the app's bucket in a profile, where the
 * processor reads them by file name:
 *
 *   tsx bin/upload-transform-configs.ts <development|e2e|staging|production>
 *
 * The buckets and endpoints come from the profile in packages/config; the
 * S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY secrets from the environment.
 */
import { readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import {
  type AppConfig,
  getConfig,
  imageProcessorSecrets,
  loadSecrets,
  resolveAppEnv,
  videoProcessorSecrets,
} from '../packages/config/src/index.js';

const env = resolveAppEnv(process.argv[2]);
const config = getConfig(env);

const apps = [
  {
    app: 'image-processor',
    s3: config.imageProcessor.s3,
    secrets: loadSecrets(imageProcessorSecrets),
  },
  {
    app: 'video-processor',
    s3: config.videoProcessor.s3,
    secrets: loadSecrets(videoProcessorSecrets),
  },
] satisfies {
  app: string;
  s3: AppConfig['imageProcessor']['s3'];
  secrets: { S3_ACCESS_KEY_ID: string; S3_SECRET_ACCESS_KEY: string };
}[];

for (const {
  app,
  s3: { bucket, ...s3 },
  secrets,
} of apps) {
  const configDir = path.resolve(
    import.meta.dirname,
    '..',
    'apps',
    app,
    'config',
  );
  const client = new S3Client({
    ...s3,
    credentials: {
      accessKeyId: secrets.S3_ACCESS_KEY_ID,
      secretAccessKey: secrets.S3_SECRET_ACCESS_KEY,
    },
  });

  const files = readdirSync(configDir).filter((file) => file.endsWith('.yaml'));

  for (const file of files) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: file,
        Body: readFileSync(path.join(configDir, file)),
        ContentType: 'application/yaml',
      }),
    );
    console.log(`Uploaded ${file} to ${bucket}`);
  }
}
