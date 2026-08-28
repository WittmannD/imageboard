import type { ThrottlerModuleOptions } from '@nestjs/throttler';

// General DoS/abuse protection applied to every endpoint that doesn't
// override it with a stricter, endpoint-specific throttle below.
export default (): { throttler: ThrottlerModuleOptions } => ({
  throttler: [
    {
      name: 'default',
      ttl: 60_000, // 1 minute
      limit: 120, // 120 requests/min per IP
    },
  ],
});

// Creating a post accepts file uploads and does image processing, so it is
// throttled well below the general default to limit storage/processing abuse.
export const CREATE_POST_THROTTLE = { default: { ttl: 60_000, limit: 10 } }; // 10 attempts/min per IP
