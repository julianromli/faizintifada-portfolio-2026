import { getDb } from '../../src/db/client.js';
import { orders as ordersTable } from '../../src/db/schema.js';
import { createPayment } from './mayar.js';
import { getCheckoutPrice, resolveCoupon } from './coupon.js';
import { markOrderPaid, sendOrderFulfillment } from './fulfillment.js';

export type CheckoutCustomer = {
  name: string;
  email: string;
  mobile: string;
  couponCode?: string;
};

export type StartCheckoutResult =
  | { ok: true; link: string }
  | { ok: false; error: string; status: 400 | 500 | 502 | 503 };

function getSiteUrl(): string {
  return (process.env.SITE_URL?.trim() || 'https://faizintifada.com').replace(/\/$/, '');
}

async function resolveCheckoutAmount(
  db: ReturnType<typeof getDb>,
  couponCode?: string,
): Promise<
  | { ok: true; amount: number; appliedCouponCode?: string }
  | { ok: false; error: string }
> {
  let amount = getCheckoutPrice();
  let appliedCouponCode: string | undefined;

  if (couponCode?.trim()) {
    const couponResult = await resolveCoupon(db, couponCode);
    if (!couponResult.valid) {
      return { ok: false, error: couponResult.error };
    }
    amount = couponResult.finalAmount;
    appliedCouponCode = couponResult.code;
  }

  return { ok: true, amount, appliedCouponCode };
}

async function startFreeCheckout(
  db: ReturnType<typeof getDb>,
  customer: CheckoutCustomer,
  appliedCouponCode: string | undefined,
  thankYouUrl: string,
): Promise<StartCheckoutResult> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return { ok: false, error: 'Checkout is not configured yet.', status: 503 };
  }

  const now = Date.now();
  let orderId: number;
  try {
    const inserted = await db
      .insert(ordersTable)
      .values({
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        amount: 0,
        currency: 'IDR',
        status: 'pending',
        couponCode: appliedCouponCode,
        createdAt: now,
      })
      .returning({ id: ordersTable.id });
    const row = inserted[0];
    if (!row) {
      return { ok: false, error: 'Could not record your order. Please contact support.', status: 500 };
    }
    orderId = row.id;
  } catch (err) {
    console.error('[checkout] free order persist failed:', err);
    return { ok: false, error: 'Could not record your order. Please contact support.', status: 500 };
  }

  try {
    await sendOrderFulfillment(db, { id: orderId, email: customer.email, name: customer.name });
    await markOrderPaid(db, orderId);
  } catch (err) {
    console.error('[checkout] free order fulfillment failed:', err);
    return {
      ok: false,
      error: 'Could not send your access email. Please try again or contact support.',
      status: 500,
    };
  }

  return { ok: true, link: thankYouUrl };
}

async function startMayarCheckout(
  db: ReturnType<typeof getDb>,
  customer: CheckoutCustomer,
  amount: number,
  appliedCouponCode: string | undefined,
  thankYouUrl: string,
): Promise<StartCheckoutResult> {
  if (!process.env.MAYAR_API_KEY?.trim()) {
    return { ok: false, error: 'Checkout is not configured yet.', status: 503 };
  }

  let payment: Awaited<ReturnType<typeof createPayment>>;
  try {
    payment = await createPayment({
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      amount,
      description: 'Faiz UI — AI-agent starter kit (lifetime access)',
      redirectUrl: thankYouUrl,
      expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error('[checkout] mayar createPayment failed:', err);
    return { ok: false, error: 'Payment gateway error. Please try again.', status: 502 };
  }

  try {
    await db.insert(ordersTable).values({
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      amount,
      currency: 'IDR',
      status: 'pending',
      couponCode: appliedCouponCode,
      mayarRef: payment.transactionId || payment.id,
      mayarPaymentId: payment.id,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error('[checkout] order persist failed:', {
      mayarRef: payment.transactionId || payment.id,
      mayarPaymentId: payment.id,
      email: customer.email,
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: 'Could not record your order. Please contact support.', status: 500 };
  }

  return { ok: true, link: payment.link };
}

export async function startCheckout(customer: CheckoutCustomer): Promise<StartCheckoutResult> {
  const db = getDb();
  const pricing = await resolveCheckoutAmount(db, customer.couponCode);
  if (!pricing.ok) {
    return { ok: false, error: pricing.error, status: 400 };
  }

  const thankYouUrl = `${getSiteUrl()}/ui/thank-you`;

  if (pricing.amount === 0) {
    return startFreeCheckout(db, customer, pricing.appliedCouponCode, thankYouUrl);
  }

  return startMayarCheckout(
    db,
    customer,
    pricing.amount,
    pricing.appliedCouponCode,
    thankYouUrl,
  );
}

/** Mark an order paid (from webhook) and send fulfillment email. */
export async function fulfillPaidOrder(order: {
  id: number;
  email: string;
  name?: string | null;
}) {
  const db = getDb();
  await markOrderPaid(db, order.id);
  await sendOrderFulfillment(db, order);
}
