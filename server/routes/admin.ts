import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db/client';
import { projects as projectsTable } from '../../src/db/schema';
import { projectToInsertValues, rowToProject } from '../../src/lib/project-mapper';
import type { Project } from '../../src/types/project';
import { projectPayloadSchema, updateProjectPayloadSchema } from '../schemas/projectPayload';
import { normalizeCmsAdminSecret } from '../../src/lib/normalize-cms-admin-secret';

function isUniqueConstraintError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(msg);
}

function payloadToProject(p: {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tags: string[];
  bgClass: string;
  imagePosition?: string;
  client?: string;
  role?: string;
  timeline?: string;
  liveUrl?: string;
  images?: string[];
}): Project {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    longDescription: p.longDescription,
    image: p.image,
    tags: p.tags,
    bgClass: p.bgClass,
    imagePosition: p.imagePosition?.trim() || undefined,
    client: p.client?.trim() || undefined,
    role: p.role?.trim() || undefined,
    timeline: p.timeline?.trim() || undefined,
    liveUrl: p.liveUrl?.trim() || undefined,
    images: p.images?.length ? p.images : undefined,
  };
}

export function createAdminApp() {
  const admin = new Hono();

  admin.use('*', async (c, next) => {
    const tok = normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN);
    if (!tok) {
      return c.json(
        { error: 'Admin API is not configured. Set CMS_ADMIN_TOKEN in the server environment.' },
        503,
      );
    }
    return bearerAuth({ token: tok })(c, next);
  });

  /** Used by AdminLogin to validate the Bearer token matches CMS_ADMIN_TOKEN. */
  admin.get('/session', (c) => c.json({ ok: true }, 200));

  admin.post('/projects', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = projectPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const db = getDb();
    const values = projectToInsertValues(payloadToProject(data), {
      featured: data.featured,
      sortOrder: data.sortOrder,
    });

    try {
      await db.insert(projectsTable).values(values);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return c.json({ error: 'A project with this slug already exists' }, 409);
      }
      console.error('[POST /api/admin/projects]', err);
      return c.json({ error: 'Failed to create project' }, 500);
    }

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.slug, data.slug))
      .limit(1);

    return c.json(rowToProject(row!), 201);
  });

  admin.put('/projects/:slug', async (c) => {
    const urlSlug = c.req.param('slug');
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const schema = updateProjectPayloadSchema(urlSlug);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const db = getDb();
    const values = projectToInsertValues(payloadToProject(data), {
      featured: data.featured,
      sortOrder: data.sortOrder,
    });

    const updated = await db
      .update(projectsTable)
      .set(values)
      .where(eq(projectsTable.slug, urlSlug))
      .returning({ id: projectsTable.id });

    if (updated.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.slug, urlSlug))
      .limit(1);

    return c.json(rowToProject(row!));
  });

  admin.delete('/projects/:slug', async (c) => {
    const slug = c.req.param('slug');
    const db = getDb();
    const removed = await db
      .delete(projectsTable)
      .where(eq(projectsTable.slug, slug))
      .returning({ id: projectsTable.id });

    if (removed.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.body(null, 204);
  });

  return admin;
}
