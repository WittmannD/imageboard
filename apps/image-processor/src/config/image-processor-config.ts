export default () => ({
  s3: {
    endpoint: 'https://s3.filebase.io',
    region: 'auto',
    credentials: {
      accessKeyId: process.env['FILEBASE_KEY'],
      secretAccessKey: process.env['FILEBASE_SECRET'],
    },
    bucket: 'imageboard'
  },
});