FROM nginx:1.31-alpine
ARG APP=imageboard-web

# Rendered into /etc/nginx/conf.d by the image's envsubst step; the mode is
# picked by docker-entrypoint.d/15-select-mode.envsh.
COPY apps/${APP}/templates/ /etc/nginx/templates/
COPY apps/${APP}/snippets/ /etc/nginx/snippets/
COPY --chmod=755 apps/${APP}/docker-entrypoint.d/ /docker-entrypoint.d/
