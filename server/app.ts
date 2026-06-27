import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { asc, eq } from 'drizzle-orm';
import { createRouteHandler } from 'uploadthing/server';
import { getDb } from '../src/db/client.js';
import {
  pageSettings as pageSettingsTable,
  projects as projectsTable,
  testimonials as testimonialsTable,
} from '../src/db/schema.js';
import { rowToTestimonial } from '../src/lib/testimonial-mapper.js';
import { coachingPayloadToInsertValues } from '../src/lib/coaching-mapper.js';
import { coachingPayloadSchema } from './schemas/coachingPayload.js';
import { coachingSubmissions as coachingSubmissionsTable } from '../src/db/schema.js';
import { HOME_PAGE_SETTINGS_KEY, rowToPageSettings } from '../src/lib/page-settings.js';
import { rowToProject } from '../src/lib/project-mapper.js';
import { CMS_UPLOAD_TOKEN_HEADER } from '../src/lib/cms-auth-headers.js';
import { createAdminApp } from './routes/admin.js';
import { createUiKitApp } from './routes/uikit.js';
import { uploadRouter } from './uploadthing.js';
import { fetchLatestYouTubeVideos, parseVideoLimit } from './youtube.js';
import { fetchGitHubContributions } from './github.js';
import { buildSitemapXml } from './sitemap.js';

const app = new Hono();

const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins = process.env.CORS_ORIGIN?.split(',').flatMap((s) => {
  const trimmed = s.trim();
  return trimmed ? [trimmed] : [];
});

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

app.get('/api/testimonials', async (c) => {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(testimonialsTable)
      .orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.id));
    return c.json(rows.map(rowToTestimonial));
  } catch (err) {
    console.error('[GET /api/testimonials]', err);
    return c.json({ error: 'Failed to load testimonials' }, 500);
  }
});

app.get('/api/page-settings', async (c) => {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(pageSettingsTable)
      .where(eq(pageSettingsTable.key, HOME_PAGE_SETTINGS_KEY))
      .limit(1);

    return c.json(rowToPageSettings(row));
  } catch (err) {
    console.error('[GET /api/page-settings]', err);
    return c.json({ error: 'Failed to load page settings' }, 500);
  }
});

app.get('/api/youtube/videos', async (c) => {
  try {
    const limit = parseVideoLimit(c.req.query('limit'));
    const videos = await fetchLatestYouTubeVideos(limit);

    c.header('Cache-Control', 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600');
    return c.json(videos);
  } catch (err) {
    const hasApiKey = Boolean(process.env.YOUTUBE_API_KEY?.trim());
    console.error(
      '[GET /api/youtube/videos]',
      err,
      hasApiKey ? '(YOUTUBE_API_KEY is set)' : '(set YOUTUBE_API_KEY when RSS returns 404)',
    );
    return c.json({ error: 'Failed to load YouTube videos' }, 500);
  }
});

app.get('/api/sitemap.xml', async (c) => {
  try {
    const xml = await buildSitemapXml();
    c.header('Content-Type', 'application/xml; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    return c.body(xml);
  } catch (err) {
    console.error('[GET /api/sitemap.xml]', err);
    return c.text('Failed to generate sitemap', 500);
  }
});

app.get('/api/github/contributions', async (c) => {
  try {
    const contributions = await fetchGitHubContributions();

    c.header('Cache-Control', 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400');
    return c.json(contributions);
  } catch (err) {
    console.error('[GET /api/github/contributions]', err);
    return c.json({ error: 'Failed to load GitHub contributions' }, 500);
  }
});

app.post('/api/coaching', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = coachingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  try {
    const db = getDb();
    const values = coachingPayloadToInsertValues(parsed.data);
    await db.insert(coachingSubmissionsTable).values(values);
    return c.json({ ok: true }, 201);
  } catch (err) {
    console.error('[POST /api/coaching]', err);
    return c.json({ error: 'Failed to submit. Please try again.' }, 500);
  }
});

app.route('/api/admin', createAdminApp());
app.route('/api', createUiKitApp());

const uploadHandlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    isDev: process.env.NODE_ENV !== 'production',
  },
});

app.all('/api/uploadthing', (c) => uploadHandlers(c.req.raw));

export default app;
