FROM oven/bun:1.3.14 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
ARG VITE_SITE_URL=https://faizintifada.com
ENV VITE_SITE_URL=${VITE_SITE_URL}
RUN bun run build

FROM base AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src

EXPOSE 3000

CMD ["bun", "server/production.ts"]
