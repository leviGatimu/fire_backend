FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
EXPOSE 8080
CMD ["npm", "run", "start", "-w", "services/api-gateway"]
