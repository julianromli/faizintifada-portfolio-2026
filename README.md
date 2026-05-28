# Faiz Intifada Portfolio

React, Vite, and Tailwind portfolio site.

## Run Locally

Prerequisites: [Bun](https://bun.sh) 1.3+ (see `packageManager` in `package.json`).

1. Install dependencies: `bun install`

2. Copy [`.env.example`](.env.example) to `.env` and set **`DATABASE_URL`** and **`DATABASE_AUTH_TOKEN`** from your [Turso](https://turso.tech) database (for local file SQLite you can use `DATABASE_URL=file:dev.sqlite` and omit the token). Set a long random **`CMS_ADMIN_TOKEN`** for the **`/admin`** CMS (**`POST` / `PUT` / `DELETE /api/admin`** use this as a Bearer secret). For image uploads in the CMS, add **`UPLOADTHING_TOKEN`** from the [UploadThing](https://uploadthing.com) dashboard (server secret only — not `VITE_`).

3. Push the schema and seed sample projects:

   ```bash
   bun run db:push
   bun run db:seed
   ```

4. Start Vite and the JSON API together:

   ```bash
   bun run dev
   ```

   - Site: `http://localhost:3000`
   - API: `http://127.0.0.1:3001` — browser calls use `/api` via the Vite proxy (`API_PORT`)

For production, set **`VITE_API_URL`** if the API is hosted separately, and **`CORS_ORIGIN`** to your frontend origin(s), comma-separated.

## Deploy on Dokploy (VPS)

This app serves the Vite SPA (`dist/`) and the Hono API on **one port**. [`vercel.json`](vercel.json) and [`api/[...route].ts`](api/[...route].ts) are for **Vercel only**; on a VPS use [`server/production.ts`](server/production.ts).

### Build and start

| Step | Command / setting |
|------|-------------------|
| Install | `bun install --frozen-lockfile` |
| Build | `bun run build` |
| Start | `bun run start` → runs `server/production.ts` |
| Listen | `0.0.0.0` on **`PORT`** (default `3000`) |

**Railpack / Nixpacks:** ensure `package.json` includes the `start` script so the platform does not fall back to `vite preview` (localhost-only → 502 behind Traefik).

**Dockerfile (recommended):** use the repo [`Dockerfile`](Dockerfile) in Dokploy (Build type: Dockerfile). Published port must match `PORT` (default `3000`).

### Environment variables

Set in Dokploy for **build** and **runtime** (see [`.env.example`](.env.example)):

| Variable | When | Notes |
|----------|------|--------|
| `VITE_SITE_URL` | Build | e.g. `https://faizintifada.com` |
| `SITE_URL` | Runtime | Same canonical URL (sitemap) |
| `PORT` | Runtime | Must match Dokploy published port |
| `NODE_ENV` | Runtime | `production` |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Runtime | Turso |
| `CORS_ORIGIN` | Runtime | e.g. `https://faizintifada.com` |
| `CMS_ADMIN_TOKEN`, `UPLOADTHING_TOKEN`, `GITHUB_TOKEN` | Runtime | API / CMS |

Leave **`VITE_API_URL`** empty when frontend and API share the same domain (same-origin `/api`).

### Post-deploy checks

1. Runtime logs show: `[production] listening on http://0.0.0.0:<port>`
2. On the VPS: `curl -I http://127.0.0.1:<PORT>/` → `200`
3. Public: `curl -I https://faizintifada.com/` → `200` (if still 502, check Cloudflare DNS/SSL vs origin)

## Database (Drizzle + Turso / libSQL)

- Schema: [`src/db/schema.ts`](src/db/schema.ts)
- HTTP API: [`server/index.ts`](server/index.ts) — public `GET /api/projects`, `GET /api/projects?featured=1`, `GET /api/projects/:slug`; admin (**Bearer `CMS_ADMIN_TOKEN`**) — `POST /api/admin/projects`, `PUT /api/admin/projects/:slug`, `DELETE /api/admin/projects/:slug`; **UploadThing** handler at `POST/GET /api/uploadthing` (uses **`UPLOADTHING_TOKEN`**; uploads require the same **CMS** Bearer as the admin UI).
- Commands: `bun run db:generate`, `bun run db:push`, `bun run db:studio`, `bun run db:seed`

## CMS (projects)

Open **`/admin`** in the browser, paste the same value as **`CMS_ADMIN_TOKEN`** from the server `.env`, then manage projects. The token stays in **`sessionStorage`** until you sign out. Do **not** put the token in any `VITE_*` variable.

Configure an app in the [UploadThing dashboard](https://uploadthing.com/dashboard) and ensure the file routes **`projectCover`** and **`projectGallery`** exist (they are defined in [`server/uploadthing.ts`](server/uploadthing.ts)).
