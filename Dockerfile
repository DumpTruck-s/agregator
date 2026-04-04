FROM node:20-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9
WORKDIR /app

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build
RUN cd packages/shared && ../../node_modules/.bin/tsc
RUN node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
RUN cd apps/api && ../../node_modules/.bin/tsc

ENV PATH="/app/node_modules/.bin:$PATH"
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "prisma migrate deploy --schema=prisma/schema.prisma; node dist/app.js"]
