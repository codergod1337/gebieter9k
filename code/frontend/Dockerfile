# Frontend-Image für den Pi (linux/arm64) und jeden anderen Docker-Host: nginx liefert die gebaute App aus und reicht
# /api an das Backend weiter (Konfiguration: ${MOUNTS_DIR}/nginx/conf/default.conf, per compose.yaml eingebunden).
# Ablauf in docu/setup.md, Abschnitt 5.16.
#
# Versionen geprüft am 2026-11-08: Node 26.13.0 (neueste 26, wie beim Entwickeln), nginx 1.30.6 (= stable).

FROM node:26.13.0-trixie-slim AS build
WORKDIR /build
# Erst nur die Abhängigkeiten: Diese Schicht bleibt im Cache, solange sich package-lock.json nicht ändert
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Baut mit .env.production: VITE_API_BASE_URL leer, das Frontend ruft relativ /api/... auf
RUN npm run build

FROM nginx:1.30.6
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80 443
