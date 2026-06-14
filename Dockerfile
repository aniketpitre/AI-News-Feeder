# ---- deps ----
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --legacy-peer-deps

# ---- builder ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN npx tsc scripts/sync-feeds.ts --target es2022 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --outDir dist

# ---- prod-deps ----
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --omit=dev --legacy-peer-deps

# ---- runner ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production node_modules so background scripts can resolve firebase-admin
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist/sync-feeds.js ./scripts/sync-feeds.js

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
