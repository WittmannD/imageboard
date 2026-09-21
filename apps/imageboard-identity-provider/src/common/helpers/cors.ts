import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

// Same source of truth clients.config.ts registers redirect_uris from - the
// client's own origins are exactly the ones that need credentialed CORS to
// call /interactions/* and /verification directly via fetch.
function getAllowedOrigins(): Set<string> {
  return new Set(
    (process.env['OIDC_CLIENT_REDIRECT_URIS'] ?? '')
      .split(/\s*,\s*/)
      .filter(Boolean)
      .map((uri) => new URL(uri).origin),
  );
}

export function getCors(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();
  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  };
}
