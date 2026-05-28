import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { normalizeCmsAdminSecret } from '../src/lib/normalize-cms-admin-secret.js';
import app from './app.js';

const distRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');

const port = Number(process.env.PORT) || 3000;
const hostname = '0.0.0.0';

if (!normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN)) {
  console.warn(
    '[production] CMS_ADMIN_TOKEN is not set; POST/PUT/DELETE /api/admin/projects will return 503.',
  );
}

if (!process.env.UPLOADTHING_TOKEN?.trim()) {
  console.warn('[production] UPLOADTHING_TOKEN is not set; uploads will fail.');
}

app.get('/sitemap.xml', (c) => c.redirect('/api/sitemap.xml', 301));

app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api')) {
    return next();
  }
  return serveStatic({ root: distRoot })(c, next);
});

app.get('*', async (c, next) => {
  if (c.req.path.startsWith('/api')) {
    return next();
  }
  return serveStatic({ root: distRoot, path: 'index.html' })(c, next);
});

serve(
  {
    fetch: app.fetch,
    port,
    hostname,
  },
  (info) => {
    console.log(`[production] listening on http://${hostname}:${info.port}`);
  },
);
