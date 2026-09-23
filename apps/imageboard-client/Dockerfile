FROM node:22-alpine AS base

ARG APP=imageboard-client

WORKDIR /usr/src/app

COPY package*.json ./
COPY --parents packages/*/package.json ./
COPY apps/${APP}/package.json ./apps/${APP}/package.json


FROM base AS dev

ENV NODE_ENV=development
ARG APP=imageboard-client

RUN npm i

COPY . .

# vite.config.ts reads the shared configuration when the dev server starts.
RUN npm -w @hdotu1/config run build

EXPOSE 5734
ENV PORT=5734
ENV HOST=0.0.0.0

CMD ["npm", "-w", "imageboard-client", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5734"]


FROM base AS builder

ENV NODE_ENV=build
ARG APP=imageboard-client

RUN npm i

COPY . .

# The browser bundle inlines the public part of the APP_ENV profile at build
# time (see vite.config.ts), so an image is built for one environment.
ARG APP_ENV=production
ENV APP_ENV=$APP_ENV

RUN npm -w @hdotu1/config run build && npm -w ${APP} run build && npm prune --omit=dev


FROM node:22-alpine AS production

ENV NODE_ENV=production
ARG APP=imageboard-client
# The server must run the profile the browser bundle was built for.
ARG APP_ENV=production
ENV APP_ENV=$APP_ENV

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/
COPY --from=builder /usr/src/app/packages/ ./packages/
COPY --from=builder /usr/src/app/apps/${APP}/node_modules* ./dist/node_modules/
COPY --from=builder /usr/src/app/apps/${APP}/dist/ ./dist/

EXPOSE 5734
ENV PORT=5734
ENV HOST=0.0.0.0

CMD ["node", "node_modules/@react-router/serve/bin.cjs", "dist/server/index.js"]
