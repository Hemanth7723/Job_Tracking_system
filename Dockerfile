# ─────────────────────────────────────────────
# Stage 1: Build the React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching.
# If package.json hasn't changed, Docker reuses the cached
# node_modules layer and skips npm install on the next build.
COPY package.json package-lock.json* ./

RUN npm ci --frozen-lockfile

# Copy the rest of the source
COPY . .

# VITE_PB_URL must be passed at build time as a build argument
# because Vite bakes env vars into the JS bundle at compile time.
# In Railway: set this as a Build Variable, not a Runtime Variable.
ARG VITE_PB_URL
ENV VITE_PB_URL=${VITE_PB_URL}

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with nginx
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove the default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config that handles SPA routing
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway assigns a dynamic port via $PORT env var.
# This script rewrites the nginx config at container startup
# to use whatever port Railway assigned.
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]