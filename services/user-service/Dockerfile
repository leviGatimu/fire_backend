FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY prisma ./prisma
COPY packages ./packages
COPY services/user-service ./services/user-service
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
RUN npx prisma generate
EXPOSE 4002
CMD ["npm", "run", "start", "-w", "services/user-service"]
