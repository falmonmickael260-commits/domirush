FROM node:22-bookworm-slim AS build
ARG GODOT_VERSION=4.7.2
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip && rm -rf /var/lib/apt/lists/*
RUN set -eu; \
    release="https://github.com/godotengine/godot-builds/releases/download/${GODOT_VERSION}-stable"; \
    curl -fsSL --retry 3 "$release/Godot_v${GODOT_VERSION}-stable_linux.x86_64.zip" -o /tmp/godot.zip; \
    unzip -p /tmp/godot.zip "Godot_v${GODOT_VERSION}-stable_linux.x86_64" > /usr/local/bin/godot; \
    chmod +x /usr/local/bin/godot; \
    curl -fsSL --retry 3 "$release/Godot_v${GODOT_VERSION}-stable_export_templates.tpz" -o /tmp/templates.tpz; \
    mkdir -p "/root/.local/share/godot/export_templates/${GODOT_VERSION}.stable"; \
    unzip -j /tmp/templates.tpz templates/web_nothreads_release.zip -d "/root/.local/share/godot/export_templates/${GODOT_VERSION}.stable"; \
    rm /tmp/godot.zip /tmp/templates.tpz
COPY package*.json ./
RUN npm ci
COPY . .
RUN sh scripts/export-godot.sh && npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
USER node
CMD ["npm", "run", "start"]
