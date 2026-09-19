// Defaults target Filebase (production). Set S3_ENDPOINT / S3_* to point the
// processor at any other S3-compatible store, e.g. MinIO for e2e tests.
export default () => ({
  s3: {
    endpoint: process.env['S3_ENDPOINT'] ?? 'https://s3.filebase.io',
    region: process.env['S3_REGION'] ?? 'auto',
    // Path-style addressing (http://host/bucket/key) is required by MinIO.
    forcePathStyle: process.env['S3_FORCE_PATH_STYLE'] === 'true',
    credentials: {
      accessKeyId: process.env['S3_ACCESS_KEY_ID'] ?? process.env['FILEBASE_KEY'],
      secretAccessKey:
        process.env['S3_SECRET_ACCESS_KEY'] ?? process.env['FILEBASE_SECRET'],
    },
    bucket: process.env['S3_BUCKET'] ?? 'imageboard'
  },
});
