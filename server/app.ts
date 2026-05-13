import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { asc, eq } from 'drizzle-orm';
import { createRouteHandler } from 'uploadthing/server';
import { getDb } from '../src/db/client.js';
import { projects as projectsTable } from '../src/db/schema.js';
import { rowToProject } from '../src/lib/project-mapper.js';
import { CMS_UPLOAD_TOKEN_HEADER } from '../src/lib/cms-auth-headers.js';
import { createAdminApp } from './routes/admin.js';
import { uploadRouter } from './uploadthing.js';

const app = new Hono();

const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);

app.use(
  '/*',
  cors({
    origin: corsOrigins?.length ? corsOrigins : devOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-uploadthing-version',
      'x-uploadthing-api-key',
      'x-uploadthing-fe-package',
      'x-uploadthing-package',
      'x-uploadthing-be-adapter',
      CMS_UPLOAD_TOKEN_HEADER,
      'b3',
      'traceparent',
    ],
  }),
);

app.get('/api/projects', async (c) => {
  try {
    const db = getDb();
    const featured = c.req.query('featured');

    const base = db.select().from(projectsTable);
    const rows = await (featured === '1'
      ? base.where(eq(projectsTable.featured, true))
      : base
    ).orderBy(asc(projectsTable.sortOrder), asc(projectsTable.slug));

    const body = rows.map(rowToProject);
    return c.json(body);
  } catch (err) {
    console.error('[GET /api/projects]', err);
    return c.json({ error: 'Failed to load projects' }, 500);
  }
});

app.get('/api/projects/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = getDb();
    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.slug, slug))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Not found' }, 404);
    }

    return c.json(rowToProject(row));
  } catch (err) {
    console.error('[GET /api/projects/:slug]', err);
    return c.json({ error: 'Failed to load project' }, 500);
  }
});

app.route('/api/admin', createAdminApp());

const uploadHandlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    isDev: process.env.NODE_ENV !== 'production',
  },
});

app.all('/api/uploadthing', (c) => uploadHandlers(c.req.raw));

export default app;
