FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY services/maintenance-service ./services/maintenance-service
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
RUN npx prisma generate
EXPOSE 4005
CMD ["npm", "run", "start", "-w", "services/maintenance-service"]
