# Faiz Intifada Portfolio

React, Vite, and Tailwind portfolio site.

## Run Locally

Prerequisites: Node.js 20+ (Bun optional).

1. Install dependencies: `npm install`

2. Copy [`.env.example`](.env.example) to `.env` and set **`DATABASE_URL`** and **`DATABASE_AUTH_TOKEN`** from your [Turso](https://turso.tech) database (for local file SQLite you can use `DATABASE_URL=file:dev.sqlite` and omit the token).

3. Push the schema and seed sample projects:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start Vite and the JSON API together:

   ```bash
   npm run dev
   ```

   - Site: `http://localhost:3000`
   - API: `http://127.0.0.1:3001` — browser calls use `/api` via the Vite proxy (`API_PORT`)

For production, set **`VITE_API_URL`** if the API is hosted separately, and **`CORS_ORIGIN`** to your frontend origin(s), comma-separated.

## Database (Drizzle + Turso / libSQL)

- Schema: [`src/db/schema.ts`](src/db/schema.ts)
- HTTP API: [`server/index.ts`](server/index.ts) — `GET /api/projects`, `GET /api/projects?featured=1`, `GET /api/projects/:slug`
- Commands: `npm run db:generate`, `npm run db:push`, `npm run db:studio`, `npm run db:seed`
