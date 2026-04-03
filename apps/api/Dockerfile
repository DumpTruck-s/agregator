FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter @delivery/api run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/app.js"]
