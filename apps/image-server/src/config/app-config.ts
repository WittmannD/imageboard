export default () => ({
  uploads: {
    destination: process.env['SHARED_PATH'] ?? '/tmp',
  },
  baseUrl: process.env['BASE_URL'] ?? 'http://localhost:3000'
});
