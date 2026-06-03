# Stage 1: Build dependencies
FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

# Stage 2: Production runtime image
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Configure security: non-root user
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

# Copy built node_modules and code
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs backend/ ./

USER nodejs
EXPOSE 3000

# Native Node-based health check (Alpine lacks curl by default)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }).on('error', () => process.exit(1));"

CMD ["node", "server.js"]
