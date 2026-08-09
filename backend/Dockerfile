FROM node:22-alpine AS builder

# Install PostgreSQL client for pg_dump/pg_restore (backup features)
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy Prisma schema (needed for generate)
COPY prisma ./prisma/

# Copy package files and install ALL dependencies (including dev for TypeScript build)
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code and config
COPY src ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma schema and generate client in production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built source
COPY --from=builder /app/dist ./dist/

# Create temp directory for uploads
RUN mkdir -p /tmp/backup-uploads

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
