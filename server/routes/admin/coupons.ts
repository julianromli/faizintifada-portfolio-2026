import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '../../../src/db/client.js';
import { coupons as couponsTable } from '../../../src/db/schema.js';
import { couponToInsertValues, rowToCoupon } from '../../../src/lib/coupon-mapper.js';
import { couponPayloadSchema } from '../../schemas/couponPayload.js';

function isUniqueConstraintError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(msg);
}

function parseCouponId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }
  return id;
}

export function createAdminCouponsApp() {
  const app = new Hono();

  app.get('/', async (c) => {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(couponsTable)
        .orderBy(desc(couponsTable.createdAt), desc(couponsTable.id));
      return c.json(rows.map(rowToCoupon));
    } catch (err) {
      console.error('[GET /api/admin/coupons]', err);
      return c.json({ error: 'Failed to load coupons' }, 500);
    }
  });

  app.post('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = couponPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = getDb();
    const values = couponToInsertValues(parsed.data);

    try {
      const inserted = await db.insert(couponsTable).values(values).returning();
      const row = inserted[0];
      if (!row) {
        return c.json({ error: 'Failed to create coupon' }, 500);
      }
      return c.json(rowToCoupon(row), 201);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return c.json({ error: 'A coupon with this code already exists.' }, 409);
      }
      console.error('[POST /api/admin/coupons]', err);
      return c.json({ error: 'Failed to create coupon' }, 500);
    }
  });

  app.put('/:id', async (c) => {
    const id = parseCouponId(c.req.param('id'));
    if (id === null) {
      return c.json({ error: 'Invalid coupon id' }, 400);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = couponPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const db = getDb();
    const values = couponToInsertValues(parsed.data);

    try {
      const updated = await db
        .update(couponsTable)
        .set({
          code: values.code,
          discountType: values.discountType,
          discountValue: values.discountValue,
          active: values.active,
          expiresAt: values.expiresAt,
        })
        .where(eq(couponsTable.id, id))
        .returning();

      const row = updated[0];
      if (!row) {
        return c.json({ error: 'Coupon not found' }, 404);
      }
      return c.json(rowToCoupon(row));
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return c.json({ error: 'A coupon with this code already exists.' }, 409);
      }
      console.error('[PUT /api/admin/coupons/:id]', err);
      return c.json({ error: 'Failed to update coupon' }, 500);
    }
  });

  app.delete('/:id', async (c) => {
    const id = parseCouponId(c.req.param('id'));
    if (id === null) {
      return c.json({ error: 'Invalid coupon id' }, 400);
    }

    try {
      const db = getDb();
      const deleted = await db
        .delete(couponsTable)
        .where(eq(couponsTable.id, id))
        .returning({ id: couponsTable.id });

      if (deleted.length === 0) {
        return c.json({ error: 'Coupon not found' }, 404);
      }
      return c.json({ ok: true, id });
    } catch (err) {
      console.error('[DELETE /api/admin/coupons/:id]', err);
      return c.json({ error: 'Failed to delete coupon' }, 500);
    }
  });

  return app;
}
