import { adminFetch, readAdminError } from './admin-api';
import type { Coupon } from '../types/coupon';

export async function fetchCoupons(): Promise<Coupon[]> {
  const res = await adminFetch('/api/admin/coupons');
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
  return (await res.json()) as Coupon[];
}

export async function createCoupon(input: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon> {
  const res = await adminFetch('/api/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
  return (await res.json()) as Coupon;
}

export async function updateCoupon(
  id: number,
  input: Omit<Coupon, 'id' | 'createdAt'>,
): Promise<Coupon> {
  const res = await adminFetch(`/api/admin/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
  return (await res.json()) as Coupon;
}

export async function deleteCoupon(id: number): Promise<void> {
  const res = await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
}
