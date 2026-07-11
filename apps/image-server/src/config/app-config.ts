export default () => ({
  uploads: {
    destination: process.env['SHARED_PATH'] ?? '/tmp',
  },
});
