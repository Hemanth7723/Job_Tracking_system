#!/bin/sh
# Railway injects a dynamic $PORT env var at runtime.
# nginx config must listen on that port, but we can't know
# it at build time, so we substitute the placeholder at startup.

set -e

# Default to 8080 if PORT is not set (useful for local Docker testing)
PORT="${PORT:-8080}"

echo "Starting nginx on port $PORT"

# Replace the __PORT__ placeholder in our nginx config with the real port
sed -i "s/__PORT__/$PORT/g" /etc/nginx/conf.d/app.conf

# Start nginx in the foreground (required for Docker — daemon mode exits immediately)
exec nginx -g "daemon off;"