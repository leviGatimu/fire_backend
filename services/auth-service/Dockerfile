# Build context is the repository root (see docker-compose.yml)
FROM node:20-alpine AS base
WORKDIR /app

# Install workspace dependencies
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY services/auth-service ./services/auth-service

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
RUN npx prisma generate

EXPOSE 4001
CMD ["npm", "run", "start", "-w", "services/auth-service"]
