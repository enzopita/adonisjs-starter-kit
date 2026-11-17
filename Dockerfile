# syntax=docker/dockerfile:1

ARG NODE_VERSION=26.13.1
ARG NGINX_VERSION=1.29
ARG COREPACK_VERSION=0.36.0

FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ARG COREPACK_VERSION
RUN npm install --global corepack@${COREPACK_VERSION} && corepack enable
WORKDIR /repo

FROM base AS fetch
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

FROM fetch AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  npm pkg delete scripts.prepare \
  && pnpm install --offline --frozen-lockfile --filter "@monorepo/backend..." --filter "@monorepo/frontend..."

FROM build AS backend-build
RUN pnpm --filter @monorepo/backend build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm --filter @monorepo/backend deploy --prod /deploy \
  && cp -r apps/backend/build /out \
  && mv /deploy/node_modules /out/node_modules

FROM build AS frontend-build
ARG VITE_API_URL
RUN pnpm --filter @monorepo/frontend build

FROM node:${NODE_VERSION}-alpine AS backend
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3333
WORKDIR /app
COPY --from=backend-build --chown=node:node /out ./
USER node
EXPOSE 3333
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 CMD wget -q --spider http://127.0.0.1:$PORT/health/live
CMD ["node", "bin/server.js"]

FROM nginx:${NGINX_VERSION}-alpine AS frontend
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /repo/apps/frontend/dist /usr/share/nginx/html
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 CMD wget -q --spider http://127.0.0.1/
