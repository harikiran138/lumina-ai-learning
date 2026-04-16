# ================================================================
# Lumina Frontend — Multi-stage Alpine build
# Stage 1 (deps):    npm ci production only
# Stage 2 (builder): full build with Next.js standalone output
# Stage 3 (runner):  minimal runtime — no node_modules, no src
#
# Expected image size: ~180 MB (vs 1.2 GB original)
# Requires: next.config.mjs → output: "standalone"  ✓ (already set)
# ================================================================

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc compat for alpine (needed by some native modules)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
# --omit=dev: exclude devDependencies from install (smaller layer)
RUN npm ci --omit=dev

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Need all deps (including devDeps) for type-check + build
COPY package.json package-lock.json* ./
RUN npm ci

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build generates .next/standalone (via output:"standalone" in next.config.mjs)
RUN npm run build

# ── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 nextjs

# Only copy the standalone bundle — no node_modules, no src
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
