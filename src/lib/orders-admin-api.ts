import { adminFetch, readAdminError } from './admin-api';
import type { Order } from '../types/order';

export async function fetchOrders(): Promise<Order[]> {
  const res = await adminFetch('/api/admin/orders');
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
  return (await res.json()) as Order[];
}
