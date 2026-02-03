# Build frontend and run app locally (API + static) with env from .env or docker-compose
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build frontend (dist/)
RUN npm run build

EXPOSE 3000

# Load .env from env_file in docker-compose; server uses process.env
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/index.ts"]
