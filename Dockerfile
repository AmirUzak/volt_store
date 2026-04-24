FROM node:20-alpine AS deps
WORKDIR /app
RUN for i in 1 2 3; do apk add --no-cache libc6-compat && exit 0; echo "apk add retry $i"; sleep 5; done; exit 1
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN for i in 1 2 3; do apk add --no-cache libc6-compat && exit 0; echo "apk add retry $i"; sleep 5; done; exit 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
