FROM node:22-alpine AS builder

ENV NODE_ENV=build
ARG APP=image-processor

WORKDIR /usr/src/app

COPY package*.json ./
COPY --parents packages/*/package.json ./
COPY apps/${APP}/package.json ./apps/${APP}/package.json

RUN npm i --include=optional --os=linux --libc=musl --cpu=x64

COPY . .

RUN npm -w ${APP} run build && npm prune --omit=dev

FROM node:22-alpine

ENV NODE_ENV=production
ARG APP=image-processor

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/
COPY --from=builder /usr/src/app/packages/ ./packages/
COPY --from=builder /usr/src/app/apps/${APP}/dist/ ./dist/

CMD ["node", "dist/main.js"]