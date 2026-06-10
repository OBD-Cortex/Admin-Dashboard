# Dockerfile for OBD-Cortex Admin Dashboard
# Note: Hostinger natively handles deployments, but this Dockerfile is provided
# for containerized environments or evaluators running the project locally.

FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# You must provide the build-time env vars if generating a static export, 
# otherwise Next.js will build it as a dynamic server.
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
