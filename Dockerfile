# ---- build: компіляція TypeScript ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ---- deps: лише production-залежності ----
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# DataBase зберігає sqlite у process.cwd()/data.
# Папка має належати користувачу, від якого працює контейнер (node, uid 1000)
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME /app/data

# не запускаємо від root
USER node

EXPOSE 8080

CMD [ "node", "dist/main.js" ]
