import type { Coupon } from '../types/coupon';

/** Launch Coupon for the Starter Kit Sales Page: 100% off, no expiry. */
export const LAUNCH_COUPON = {
  code: 'FAIZ100',
  discountType: 'percent' as const,
  discountValue: 100,
};

/**
 * Seed Coupons upserted by `scripts/seed-coupons.ts`.
 * `ensureSeedCoupons` also inserts a missing code on first Checkout or admin
 * Coupons load, so production gets a working code without a manual seed.
 * `expiresAt` is omitted on purpose — the Coupon does not expire.
 */
export const seedCoupons: Array<Omit<Coupon, 'id' | 'createdAt'>> = [
  {
    ...LAUNCH_COUPON,
    active: true,
  },
];
