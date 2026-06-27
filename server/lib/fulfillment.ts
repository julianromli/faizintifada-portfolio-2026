import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db/client.js';
import { orders as ordersTable } from '../../src/db/schema.js';
import { sendFulfillmentEmail } from './email.js';

type Db = ReturnType<typeof getDb>;

/** Send fulfillment email and mark emailSentAt. Order must already exist. */
export async function sendOrderFulfillment(
  db: Db,
  order: { id: number; email: string; name?: string | null },
) {
  await sendFulfillmentEmail({ orderId: order.id, to: order.email, name: order.name });
  await db
    .update(ordersTable)
    .set({ emailSentAt: Date.now() })
    .where(eq(ordersTable.id, order.id));
}

export async function markOrderPaid(db: Db, orderId: number) {
  const now = Date.now();
  await db
    .update(ordersTable)
    .set({ status: 'paid', paidAt: now })
    .where(eq(ordersTable.id, orderId));
}
