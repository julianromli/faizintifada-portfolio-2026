import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { desc, asc, eq } from 'drizzle-orm';
import { getDb } from '../../src/db/client.js';
import {
  pageSettings as pageSettingsTable,
  projects as projectsTable,
  testimonials as testimonialsTable,
  coachingSubmissions as coachingSubmissionsTable,
  coachingTestimonials as coachingTestimonialsTable,
  orders as ordersTable,
  uiKitSettings as uiKitSettingsTable,
} from '../../src/db/schema.js';
import { rowToOrder } from '../../src/lib/order-mapper.js';
import { rowToTestimonial, testimonialToInsertValues } from '../../src/lib/testimonial-mapper.js';
import { rowToCoachingSubmission } from '../../src/lib/coaching-mapper.js';
import { rowToCoachingTestimonial } from '../../src/lib/coaching-testimonial-mapper.js';
import {
  HOME_PAGE_SETTINGS_KEY,
  pageSettingsToInsertValues,
  rowToPageSettings,
} from '../../src/lib/page-settings.js';
import {
  UI_KIT_SETTINGS_KEY,
  rowToUiKitSettings,
  uiKitSettingsToInsertValues,
  type UiKitSettings,
} from '../../src/lib/ui-kit-settings.js';
import { projectToInsertValues, rowToProject } from '../../src/lib/project-mapper.js';
import type { Project } from '../../src/types/project.js';
import { pageSettingsPayloadSchema } from '../schemas/pageSettingsPayload.js';
import { uiKitSettingsPayloadSchema } from '../schemas/uiKitSettingsPayload.js';
import { projectPayloadSchema, updateProjectPayloadSchema } from '../schemas/projectPayload.js';
import { testimonialPayloadSchema } from '../schemas/testimonialPayload.js';
import { normalizeCmsAdminSecret } from '../../src/lib/normalize-cms-admin-secret.js';
import { createAdminCouponsApp } from './admin/coupons.js';

function decodeParamSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(msg);
}

function parseTestimonialId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }
  return id;
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

  admin.get('/page-settings', async (c) => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(pageSettingsTable)
      .where(eq(pageSettingsTable.key, HOME_PAGE_SETTINGS_KEY))
      .limit(1);

    return c.json(rowToPageSettings(row));
  });

  admin.put('/page-settings', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = pageSettingsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = getDb();
    const values = pageSettingsToInsertValues(parsed.data);
    await db
      .insert(pageSettingsTable)
      .values(values)
      .onConflictDoUpdate({
        target: pageSettingsTable.key,
        set: {
          avatarImage: values.avatarImage,
          heroImageTop: values.heroImageTop,
          heroImageMiddle: values.heroImageMiddle,
          heroImageBottom: values.heroImageBottom,
        },
      });

    return c.json(rowToPageSettings(values));
  });

  admin.get('/ui-kit-settings', async (c) => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(uiKitSettingsTable)
      .where(eq(uiKitSettingsTable.key, UI_KIT_SETTINGS_KEY))
      .limit(1);

    return c.json(rowToUiKitSettings(row));
  });

  admin.put('/ui-kit-settings', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = uiKitSettingsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const settings: UiKitSettings = {
      screenshots: parsed.data.screenshots,
      previewVideoUrl: parsed.data.previewVideoUrl,
      featuresVideoUrl: parsed.data.featuresVideoUrl,
      installVideoUrl: parsed.data.installVideoUrl,
    };

    const db = getDb();
    const values = uiKitSettingsToInsertValues(settings);
    await db
      .insert(uiKitSettingsTable)
      .values(values)
      .onConflictDoUpdate({
        target: uiKitSettingsTable.key,
        set: {
          screenshotsJson: values.screenshotsJson,
          previewVideoUrl: values.previewVideoUrl,
          featuresVideoUrl: values.featuresVideoUrl,
          installVideoUrl: values.installVideoUrl,
        },
      });

    return c.json(rowToUiKitSettings(values));
  });

  admin.get('/testimonials', async (c) => {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(testimonialsTable)
        .orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.id));
      return c.json(rows.map(rowToTestimonial));
    } catch (err) {
      console.error('[GET /api/admin/testimonials]', err);
      return c.json({ error: 'Failed to load testimonials' }, 500);
    }
  });

  admin.post('/testimonials', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = testimonialPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = getDb();
    const values = testimonialToInsertValues(parsed.data);

    try {
      const inserted = await db.insert(testimonialsTable).values(values).returning();
      const row = inserted[0];
      if (!row) {
        return c.json({ error: 'Failed to create testimonial' }, 500);
      }
      return c.json(rowToTestimonial(row), 201);
    } catch (err) {
      console.error('[POST /api/admin/testimonials]', err);
      return c.json({ error: 'Failed to create testimonial' }, 500);
    }
  });

  admin.put('/testimonials/:id', async (c) => {
    const id = parseTestimonialId(c.req.param('id'));
    if (id === null) {
      return c.json({ error: 'Invalid testimonial id' }, 400);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = testimonialPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = getDb();
    const values = testimonialToInsertValues(parsed.data);

    try {
      const updated = await db
        .update(testimonialsTable)
        .set(values)
        .where(eq(testimonialsTable.id, id))
        .returning({ id: testimonialsTable.id });

      if (updated.length === 0) {
        return c.json({ error: 'Testimonial not found' }, 404);
      }

      const [row] = await db
        .select()
        .from(testimonialsTable)
        .where(eq(testimonialsTable.id, id))
        .limit(1);

      return c.json(rowToTestimonial(row!));
    } catch (err) {
      console.error('[PUT /api/admin/testimonials/:id]', err);
      return c.json({ error: 'Failed to update testimonial' }, 500);
    }
  });

  admin.delete('/testimonials/:id', async (c) => {
    const id = parseTestimonialId(c.req.param('id'));
    if (id === null) {
      return c.json({ error: 'Invalid testimonial id' }, 400);
    }

    const db = getDb();
    try {
      const removed = await db
        .delete(testimonialsTable)
        .where(eq(testimonialsTable.id, id))
        .returning({ id: testimonialsTable.id });

      if (removed.length === 0) {
        return c.json({ error: 'Testimonial not found' }, 404);
      }

      return c.json({ ok: true, id }, 200);
    } catch (err) {
      console.error('[DELETE /api/admin/testimonials/:id]', err);
      return c.json({ error: 'Failed to delete testimonial' }, 500);
    }
  });

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
    const urlSlug = decodeParamSlug(c.req.param('slug'));
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const schema = updateProjectPayloadSchema();
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

    let updated: Array<{ id: number }>;
    try {
      updated = await db
        .update(projectsTable)
        .set(values)
        .where(eq(projectsTable.slug, urlSlug))
        .returning({ id: projectsTable.id });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return c.json({ error: 'A project with this slug already exists' }, 409);
      }
      console.error('[PUT /api/admin/projects/:slug]', err);
      return c.json({ error: 'Failed to update project' }, 500);
    }

    if (updated.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.slug, data.slug))
      .limit(1);

    return c.json(rowToProject(row!));
  });

  admin.delete('/projects/:slug', async (c) => {
    const slug = decodeParamSlug(c.req.param('slug'));
    const db = getDb();
    try {
      const removed = await db
        .delete(projectsTable)
        .where(eq(projectsTable.slug, slug))
        .returning({ id: projectsTable.id });

      if (removed.length === 0) {
        return c.json({ error: 'Project not found' }, 404);
      }

      return c.json({ ok: true, slug }, 200);
    } catch (err) {
      console.error('[DELETE /api/admin/projects/:slug]', err);
      return c.json({ error: 'Failed to delete project' }, 500);
    }
  });

  admin.get('/orders', async (c) => {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(ordersTable)
        .orderBy(desc(ordersTable.createdAt), desc(ordersTable.id));
      return c.json(rows.map(rowToOrder));
    } catch (err) {
      console.error('[GET /api/admin/orders]', err);
      return c.json({ error: 'Failed to load orders' }, 500);
    }
  });

  admin.route('/coupons', createAdminCouponsApp());

  admin.get('/coaching', async (c) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(coachingSubmissionsTable)
      .orderBy(desc(coachingSubmissionsTable.createdAt), desc(coachingSubmissionsTable.id));
    return c.json(rows.map(rowToCoachingSubmission));
  });

  admin.delete('/coaching/:id', async (c) => {
    const id = Number.parseInt(c.req.param('id'), 10);
    if (!Number.isFinite(id) || id < 1) {
      return c.json({ error: 'Invalid id' }, 400);
    }
    const db = getDb();
    try {
      const removed = await db
        .delete(coachingSubmissionsTable)
        .where(eq(coachingSubmissionsTable.id, id))
        .returning({ id: coachingSubmissionsTable.id });
      if (removed.length === 0) {
        return c.json({ error: 'Submission not found' }, 404);
      }
      return c.json({ ok: true, id }, 200);
    } catch (err) {
      console.error('[DELETE /api/admin/coaching/:id]', err);
      return c.json({ error: 'Failed to delete submission' }, 500);
    }
  });

  admin.get('/coaching-testimonials', async (c) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(coachingTestimonialsTable)
      .orderBy(desc(coachingTestimonialsTable.createdAt), desc(coachingTestimonialsTable.id));
    return c.json(rows.map(rowToCoachingTestimonial));
  });

  admin.delete('/coaching-testimonials/:id', async (c) => {
    const id = Number.parseInt(c.req.param('id'), 10);
    if (!Number.isFinite(id) || id < 1) {
      return c.json({ error: 'Invalid id' }, 400);
    }
    const db = getDb();
    try {
      const removed = await db
        .delete(coachingTestimonialsTable)
        .where(eq(coachingTestimonialsTable.id, id))
        .returning({ id: coachingTestimonialsTable.id });
      if (removed.length === 0) {
        return c.json({ error: 'Testimonial not found' }, 404);
      }
      return c.json({ ok: true, id }, 200);
    } catch (err) {
      console.error('[DELETE /api/admin/coaching-testimonials/:id]', err);
      return c.json({ error: 'Failed to delete testimonial' }, 500);
    }
  });

  return admin;
}
