# Build and run the server in production
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=5000
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm i --omit=dev --no-audit --no-fund
EXPOSE 5000
CMD ["node","dist/index.js"]

