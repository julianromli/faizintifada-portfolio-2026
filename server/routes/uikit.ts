import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '../../src/db/client.js';
import { orders as ordersTable } from '../../src/db/schema.js';
import { checkoutPayloadSchema } from '../schemas/checkoutPayload.js';
import { createPayment, getPayment, isPaidStatus } from '../lib/mayar.js';
import { sendFulfillmentEmail } from '../lib/email.js';

const FAIZ_UI_PRICE = 99000;

function getPrice(): number {
  const raw = Number(process.env.FAIZ_UI_PRICE_IDR);
  return Number.isFinite(raw) && raw > 0 ? raw : FAIZ_UI_PRICE;
}

function getSiteUrl(): string {
  return (process.env.SITE_URL?.trim() || 'https://faizintifada.com').replace(/\/$/, '');
}

export function createUiKitApp() {
  const app = new Hono();

  // Create a Mayar payment for the faiz-ui kit and return its hosted checkout link.
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

    if (!process.env.MAYAR_API_KEY?.trim()) {
      return c.json({ error: 'Checkout is not configured yet.' }, 503);
    }

    const { name, email, mobile } = parsed.data;
    const amount = getPrice();

    try {
      const payment = await createPayment({
        name,
        email,
        mobile,
        amount,
        description: 'Faiz UI — AI-agent starter kit (lifetime access)',
        redirectUrl: `${getSiteUrl()}/ui/thank-you`,
        expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

      const db = getDb();
      await db.insert(ordersTable).values({
        name,
        email,
        mobile,
        amount,
        currency: 'IDR',
        status: 'pending',
        mayarRef: payment.transactionId || payment.id,
        mayarPaymentId: payment.id,
        createdAt: Date.now(),
      });

      return c.json({ link: payment.link });
    } catch (err) {
      console.error('[POST /api/checkout]', err);
      return c.json({ error: 'Failed to start checkout. Please try again.' }, 502);
    }
  });

  // Mayar webhook. Secret lives in the URL (Mayar has no payload signature);
  // we additionally re-verify the payment via the Mayar API before fulfilling.
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

      // Fallback: Mayar's transaction-id field can vary, so also match the most
      // recent pending order by customer email + amount.
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

      // Unknown transaction — not one of ours; ack so Mayar stops retrying.
      if (!order) {
        return c.json({ ok: true, ignored: 'unknown-order' });
      }

      // Already fulfilled — idempotent ack.
      if (order.emailSentAt) {
        return c.json({ ok: true, alreadyFulfilled: true });
      }

      // Re-verify against Mayar before trusting the webhook (no signature available).
      const detail = await getPayment(order.mayarPaymentId ?? transactionId);
      if (!detail || !isPaidStatus(detail.status)) {
        return c.json({ ok: true, ignored: 'not-paid-yet' });
      }
      if (detail.amount > 0 && detail.amount < order.amount) {
        console.warn('[mayar webhook] amount mismatch', { order: order.amount, paid: detail.amount });
        return c.json({ ok: true, ignored: 'amount-mismatch' });
      }

      const now = Date.now();
      await db
        .update(ordersTable)
        .set({ status: 'paid', paidAt: now })
        .where(eq(ordersTable.id, order.id));

      try {
        await sendFulfillmentEmail({ orderId: order.id, to: order.email, name: order.name });
        await db
          .update(ordersTable)
          .set({ emailSentAt: Date.now() })
          .where(eq(ordersTable.id, order.id));
      } catch (mailErr) {
        // Order is marked paid; surface a 500 so Mayar retries the email send.
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
