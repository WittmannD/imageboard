export const AppConfig = () => ({
  verificationSessionTTL: 1000 * 60 * 15, // 15 minutes
  verificationResendCooldown: 1000 * 60, // 1 minute
  verificationOTPSaltRounds: 8,
  pwHashSaltRounds: 10,

  //redis[s]://[[username][:password]@][host][:port][/db-number]
  redisUrl: `redis://${process.env['REDIS_HOST'] ?? 'localhost'}:${process.env['REDIS_PORT'] ?? 6379}`
});