FROM node:22-alpine AS builder

ENV NODE_ENV=build
ARG APP=video-processor

WORKDIR /usr/src/app

COPY package*.json ./
COPY --parents packages/*/package.json ./
COPY apps/${APP}/package.json ./apps/${APP}/package.json

RUN npm i --include=optional --os=linux --libc=musl --cpu=x64

COPY . .

RUN npm -w ${APP} run build && npm prune --omit=dev

FROM node:22-alpine

ENV NODE_ENV=production
ARG APP=video-processor

# ffmpeg and ffprobe; the build fails if an encoder the operations use is missing
RUN apk add --no-cache ffmpeg \
  && ffprobe -version > /dev/null \
  && for encoder in libx264 aac libvpx-vp9 libopus mjpeg png libwebp; do \
    ffmpeg -hide_banner -encoders | grep -qw "$encoder" \
      || { echo "ffmpeg lacks the $encoder encoder" >&2; exit 1; }; \
  done

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/
COPY --from=builder /usr/src/app/packages/ ./packages/
COPY --from=builder /usr/src/app/apps/${APP}/dist/ ./dist/

CMD ["node", "dist/main.js"]
