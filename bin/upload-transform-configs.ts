/**
 * Uploads the image-processor transform configs (apps/image-processor/config)
 * to the root of a profile's image bucket, where the image-processor reads
 * them by file name:
 *
 *   tsx bin/upload-transform-configs.ts <development|e2e|staging|production>
 *
 * The bucket and endpoint come from the profile in packages/config; the
 * S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY secrets from the environment.
 */
import { readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import {
  getConfig,
  imageProcessorSecrets,
  loadSecrets,
  resolveAppEnv,
} from '../packages/config/src/index.js';

const configDir = path.resolve(
  import.meta.dirname,
  '..',
  'apps',
  'image-processor',
  'config',
);

const env = resolveAppEnv(process.argv[2]);
const { bucket, ...s3 } = getConfig(env).imageProcessor.s3;
const secrets = loadSecrets(imageProcessorSecrets);

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
