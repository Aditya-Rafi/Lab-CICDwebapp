# Stage 1: Build dependencies (pinned to specific Alpine version)
FROM node:22-alpine3.21 AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production runtime image (same base for consistency)
FROM node:22-alpine3.21
WORKDIR /app
ENV NODE_ENV=production

# Patch OS-level vulnerabilities, upgrade npm to resolve bundled CVEs
RUN apk update && apk upgrade --no-cache && \
    npm install -g npm@latest && \
    npm cache clean --force && \
    rm -rf /root/.npm /var/cache/apk/*

# Non-root user for security
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

# Copy only production deps and application code
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs backend/ ./

USER nodejs
EXPOSE 5000

# Native Node health check (Alpine lacks curl by default)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:5000/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }).on('error', () => process.exit(1));"

CMD ["node", "server.js"]
