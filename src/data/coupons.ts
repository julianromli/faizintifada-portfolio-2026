import type { Coupon } from '../types/coupon';

/** Default launch Coupon for the Starter Kit Sales Page. */
export const LAUNCH_COUPON = {
  code: 'FAIZ50',
  discountType: 'percent' as const,
  discountValue: 50,
};

/**
 * Seed Coupons upserted by `scripts/seed-coupons.ts`.
 * `ensureSeedCoupons` also inserts a missing code on first Checkout or admin
 * Coupons load, so production gets a working code without a manual seed.
 */
export const seedCoupons: Array<Omit<Coupon, 'id' | 'createdAt'>> = [
  {
    ...LAUNCH_COUPON,
    active: true,
  },
];
