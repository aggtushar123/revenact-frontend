# Builds the static site once and leaves it in /out for the reverse proxy to
# serve — the deployment's compose file mounts a volume there. VITE_API_URL is
# baked in at build time (Vite inlines import.meta.env), so the deployment
# passes the public origin; same origin as the API, so no CORS in production.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM alpine:3.20
COPY --from=build /app/dist /dist
# Copy into the mounted volume and exit; Caddy serves what lands there. Root
# because the volume is root-owned; no ports, no secrets, runs for seconds.
# nosemgrep: dockerfile.security.missing-user.missing-user
CMD ["sh", "-c", "rm -rf /out/* && cp -r /dist/. /out/ && echo 'frontend published'"]
