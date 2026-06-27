import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../../src/db/client.js';
import { orders as ordersTable } from '../../src/db/schema.js';
import { checkoutPayloadSchema } from '../schemas/checkoutPayload.js';
import { validateCouponPayloadSchema } from '../schemas/couponPayload.js';
import { getPayment, isPaidStatus } from '../lib/mayar.js';
import { resolveCoupon } from '../lib/coupon.js';
import { fulfillPaidOrder, startCheckout } from '../lib/checkout.js';

export function createUiKitApp() {
  const app = new Hono();

  app.post('/coupon/validate', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = validateCouponPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    try {
      const result = await resolveCoupon(getDb(), parsed.data.code);
      return c.json(result);
    } catch (err) {
      console.error('[POST /api/coupon/validate]', err);
      return c.json({ error: 'Could not validate coupon.' }, 500);
    }
  });

  app.post('/checkout', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = checkoutPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const { name, email, mobile, couponCode } = parsed.data;
    const result = await startCheckout({ name, email, mobile, couponCode });

    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({ link: result.link });
  });

  app.post('/mayar/webhook/:secret', async (c) => {
    const secret = c.req.param('secret');
    const expected = process.env.MAYAR_WEBHOOK_SECRET?.trim();
    if (!expected || secret !== expected) {
      return c.json({ error: 'Not found' }, 404);
    }

    type WebhookBody = { event?: string; data?: Record<string, unknown> };
    let body: WebhookBody | null = null;
    try {
      body = (await c.req.json()) as WebhookBody;
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const event = String(body?.event ?? '');
    if (event !== 'payment.received') {
      return c.json({ ok: true, ignored: event || 'unknown' });
    }

    const data = body?.data ?? {};
    const transactionId = String(data.transactionId ?? data.id ?? '');
    if (!transactionId) {
      return c.json({ ok: true, ignored: 'no-transaction-id' });
    }

    try {
      const db = getDb();
      let [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.mayarRef, transactionId))
        .limit(1);

      if (!order) {
        const email = String(data.customerEmail ?? '').trim();
        const amount = Number(data.amount ?? 0);
        if (email) {
          const [candidate] = await db
            .select()
            .from(ordersTable)
            .where(and(eq(ordersTable.email, email), eq(ordersTable.status, 'pending')))
            .orderBy(desc(ordersTable.createdAt))
            .limit(1);
          if (candidate && (amount === 0 || candidate.amount === amount)) {
            order = candidate;
          }
        }
      }

      if (!order) {
        return c.json({ ok: true, ignored: 'unknown-order' });
      }

      if (order.emailSentAt) {
        return c.json({ ok: true, alreadyFulfilled: true });
      }

      const detail = await getPayment(order.mayarPaymentId ?? transactionId);
      if (!detail || !isPaidStatus(detail.status)) {
        return c.json({ ok: true, ignored: 'not-paid-yet' });
      }
      if (detail.amount > 0 && detail.amount < order.amount) {
        console.warn('[mayar webhook] amount mismatch', { order: order.amount, paid: detail.amount });
        return c.json({ ok: true, ignored: 'amount-mismatch' });
      }

      try {
        await fulfillPaidOrder(order);
      } catch (mailErr) {
        console.error('[mayar webhook] fulfillment email failed', mailErr);
        return c.json({ error: 'Fulfillment email failed' }, 500);
      }

      return c.json({ ok: true, fulfilled: true });
    } catch (err) {
      console.error('[POST /api/mayar/webhook]', err);
      return c.json({ error: 'Webhook processing failed' }, 500);
    }
  });

  return app;
}
