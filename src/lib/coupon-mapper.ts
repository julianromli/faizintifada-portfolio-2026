import type { CouponRow } from '../db/schema.js';
import type { Coupon } from '../types/coupon.js';

export function rowToCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    active: row.active,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
  };
}

export function couponToInsertValues(input: {
  code: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  active: boolean;
  expiresAt?: number | null;
  createdAt?: number;
}) {
  return {
    code: input.code.trim().toUpperCase(),
    discountType: input.discountType,
    discountValue: input.discountValue,
    active: input.active,
    expiresAt: input.expiresAt ?? null,
    createdAt: input.createdAt ?? Date.now(),
  };
}
