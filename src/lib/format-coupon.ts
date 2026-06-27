import type { CouponDiscountType } from '../types/coupon.js';

export function formatCouponDiscount(type: CouponDiscountType, value: number): string {
  if (type === 'fixed') {
    return `Rp${value.toLocaleString('id-ID')} off`;
  }
  return `${value}% off`;
}
