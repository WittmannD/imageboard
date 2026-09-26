#!/bin/sh
# Picks up renewed Let's Encrypt certificates (see the certbot service).

if [ "${TLS_ENABLED:-}" = "true" ]; then
    (while sleep 6h; do nginx -s reload; done) &
fi
