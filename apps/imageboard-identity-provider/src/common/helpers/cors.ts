import { ForbiddenException } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

/**
 * The origins allowed to talk to this service from a browser:
 * - the registered clients' - the same source of truth clients.config.ts
 *   registers redirect_uris from - which call /interactions/*, /verification
 *   and /password-reset directly via fetch;
 * - the service's own, because pages it serves itself (the logout
 *   confirmation form) POST back to it, and browsers send their own origin in
 *   the `Origin` header even for that.
 */
function getAllowedOrigins(): Set<string> {
  const origins = (process.env['OIDC_CLIENT_REDIRECT_URIS'] ?? '')
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map((uri) => new URL(uri).origin);

  const issuer = process.env['ISSUER_URL'];

  if (issuer) {
    origins.push(new URL(issuer).origin);
  }

  return new Set(origins);
}

export function getCors(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();
  return {
    // Credentialed requests can't use a wildcard, so an allowed origin is
    // echoed back. A request with no `Origin` (server-to-server calls, plain
    // navigations) isn't cross-origin at all and passes through.
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new ForbiddenException(`Origin ${origin} is not allowed`), false);
    },
    credentials: true,
  };
}
