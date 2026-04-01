# ─────────────────────────────────────────────────────────────────
# Stage 1: Builder — compile TypeScript
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production — lean runtime image
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy compiled output and runtime dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Create upload directory for pest images
RUN mkdir -p uploads/pest-images

EXPOSE 3000

CMD ["node", "dist/server.js"]
