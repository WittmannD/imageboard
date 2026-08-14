FROM node:22-alpine AS builder

ENV NODE_ENV=build
ARG APP=imageboard-api

WORKDIR /usr/src/app

COPY package*.json ./
COPY --parents packages/*/package.json ./
COPY apps/${APP}/package.json ./apps/${APP}/package.json

RUN npm i

COPY . .

RUN npm -w ${APP} run build && npm prune --omit=dev

FROM node:22-alpine

ENV NODE_ENV=production
ARG APP=imageboard-api

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/
COPY --from=builder /usr/src/app/packages/ ./packages/
COPY --from=builder /usr/src/app/apps/${APP}/node_modules* ./dist/node_modules/
COPY --from=builder /usr/src/app/apps/${APP}/dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]