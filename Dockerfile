FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --shamefully-hoist

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN cd packages/shared && ../../node_modules/.bin/tsc
RUN node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
RUN cd apps/api && ../../node_modules/.bin/tsc

FROM node:20-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --shamefully-hoist

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY apps/api/prisma ./apps/api/prisma
RUN node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "../../node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && node dist/app.js"]
