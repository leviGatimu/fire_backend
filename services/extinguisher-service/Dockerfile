FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY services/extinguisher-service ./services/extinguisher-service
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
RUN npx prisma generate
EXPOSE 4003
CMD ["npm", "run", "start", "-w", "services/extinguisher-service"]
