# ─────────────────────────────────────────────
# Stage 1: Build the React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# ✅ FIX 1: Use npm install instead of npm ci (avoids peer dependency crash)
RUN npm install

# Copy source
COPY . .

# ✅ Build-time env variable
ARG VITE_PB_URL
ENV VITE_PB_URL=${VITE_PB_URL}

# Build app
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with nginx
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Railway dynamic port
EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]