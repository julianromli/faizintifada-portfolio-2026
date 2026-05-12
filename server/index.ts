import 'dotenv/config';
import { serve } from '@hono/node-server';
import { normalizeCmsAdminSecret } from '../src/lib/normalize-cms-admin-secret';
import app from './app';

const port = Number(process.env.API_PORT) || 3001;

if (!normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN)) {
  console.warn(
    '[api] CMS_ADMIN_TOKEN is not set; POST/PUT/DELETE /api/admin/projects will return 503 until you set it.',
  );
}

if (!process.env.UPLOADTHING_TOKEN?.trim()) {
  console.warn('[api] UPLOADTHING_TOKEN is not set; uploads will fail until you add it from the UploadThing dashboard.');
}

serve({
  fetch: app.fetch,
  port,
});

console.log(`API listening on http://127.0.0.1:${port}`);
