# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy .env file if it exists
COPY .env* ./

# Build the application with environment variables
RUN --mount=type=secret,id=env_file \
  if [ -f .env ]; then set -a && source .env && set +a; fi && \
  pnpm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm in runtime image
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port (use 8080 for Oracle Cloud compatibility)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]
