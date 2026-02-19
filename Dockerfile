# ============================================================
# Stage 1: base — 共通の Alpine Node.js イメージ
# ============================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ============================================================
# Stage 2: deps — 依存パッケージのインストール
# ============================================================
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 3: builder — Prisma Client 生成 + Next.js ビルド
# ============================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client を生成
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 4: runner — 最小構成のプロダクションイメージ
# ============================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非 root ユーザーを作成
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone ビルド成果物をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static

# Prisma マイグレーション実行に必要なファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/prisma               ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma  ./node_modules/prisma

# エントリポイントスクリプトをコピー
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
