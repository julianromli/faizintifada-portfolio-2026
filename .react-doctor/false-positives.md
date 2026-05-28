# React Doctor false positives

Patterns listed here are suppressed during triage. Only add entries after verifying the code shape.

## deslop/unused-file

All application source files in this Vite SPA are reachable from `index.html` → `src/main.tsx` → `src/App.tsx` (routes + lazy admin pages). Server files (`server/**`, `api/[...route].ts`) are separate entry points for the Hono API.

- `src/**` — SPA source tree
- `server/**` — API server entry points
- `api/[...route].ts` — Vercel serverless adapter
- `dist/**` — build output, not source

## deslop/unused-dev-dependency

- `react-doctor` — used via `package.json` `"doctor"` script and local triage workflow
