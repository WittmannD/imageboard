export const AppConfig = () => ({
  verificationSessionTTL: 1000 * 60 * 15, // 15 minutes
  verificationResendCooldown: 1000 * 60, // 1 minute
  verificationOTPSaltRounds: 8,
  pwHashSaltRounds: 10,

  //redis[s]://[[username][:password]@][host][:port][/db-number]
  redisUrl: `redis://${process.env['REDIS_HOST'] ?? 'localhost'}:${process.env['REDIS_PORT'] ?? 6379}`,

  // Base64-encoded 32-byte AES-256 key used to encrypt JWKS private key
  // material at rest in Postgres. Generate with: openssl rand -base64 32
  jwksEncryptionKey: process.env['JWKS_ENCRYPTION_KEY'] ?? '',
});