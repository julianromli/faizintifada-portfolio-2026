import type { OrderRow } from '../db/schema.js';
import type { Order, OrderStatus } from '../types/order.js';

export function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    name: row.name ?? undefined,
    email: row.email,
    mobile: row.mobile ?? undefined,
    amount: row.amount,
    currency: row.currency,
    status: row.status as OrderStatus,
    mayarRef: row.mayarRef ?? undefined,
    mayarPaymentId: row.mayarPaymentId ?? undefined,
    couponCode: row.couponCode ?? undefined,
    createdAt: row.createdAt,
    paidAt: row.paidAt ?? undefined,
    emailSentAt: row.emailSentAt ?? undefined,
  };
}
