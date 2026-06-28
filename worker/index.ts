/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers entry.
 *
 * One Worker serves both the Vite SPA (via the ASSETS binding) and the Hono
 * API. `/api/*` and `/sitemap.xml` go to the Hono app; everything else is
 * served as a static asset, with `not_found_handling: "single-page-application"`
 * falling back to index.html for client-side routes.
 *
 * `process.env` is populated from the Worker's `env` binding before the Hono
 * app is imported, so the app's existing `process.env.*` reads work unchanged.
 */

type FetchHandler = (request: Request) => Promise<Response>;

interface WorkerEnv {
  ASSETS: Fetcher;
  [key: string]: string | Fetcher | undefined;
}

let appLoaded = false;
let appFetch: FetchHandler | null = null;
let envPrepared = false;

function prepareEnv(env: WorkerEnv): void {
  if (envPrepared) return;
  const processRef = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  if (processRef?.env) {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') {
        processRef.env[key] = value;
      }
    }
  }
  envPrepared = true;
}

async function getApp(): Promise<FetchHandler> {
  if (!appLoaded) {
    const mod = await import('../server/app.js');
    appFetch = mod.default.fetch.bind(mod.default) as FetchHandler;
    appLoaded = true;
  }
  return appFetch!;
}

function isApiRequest(pathname: string): boolean {
  return pathname === '/sitemap.xml' || pathname === '/api' || pathname.startsWith('/api/');
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    prepareEnv(env);

    const url = new URL(request.url);

    if (isApiRequest(url.pathname)) {
      const fetch = await getApp();

      if (url.pathname === '/sitemap.xml') {
        const apiUrl = new URL('/api/sitemap.xml', url);
        return fetch(new Request(apiUrl, request));
      }

      return fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
