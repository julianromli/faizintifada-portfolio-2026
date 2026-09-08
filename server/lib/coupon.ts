import { eq } from 'drizzle-orm';
import { seedCoupons } from '../../src/data/coupons.js';
import { coupons as couponsTable, type CouponRow } from '../../src/db/schema.js';
import { getDb } from '../../src/db/client.js';
import { couponToInsertValues } from '../../src/lib/coupon-mapper.js';
import { formatCouponDiscount } from '../../src/lib/format-coupon.js';
import type { CouponValidation, CouponValidationError } from '../../src/types/coupon.js';

const FAIZ_UI_PRICE = 99000;

function isUniqueConstraintError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(msg);
}

let seedCouponsEnsured = false;

/**
 * Insert seed Coupons when their codes are missing.
 * Does not overwrite an existing row, so an admin can deactivate a launch
 * Coupon without the next Worker cold start turning it back on.
 */
export async function ensureSeedCoupons(db: ReturnType<typeof getDb>): Promise<void> {
  if (seedCouponsEnsured) return;

  await Promise.all(
    seedCoupons.map(async (coupon) => {
      const values = couponToInsertValues(coupon);
      const [existing] = await db
        .select({ id: couponsTable.id })
        .from(couponsTable)
        .where(eq(couponsTable.code, values.code))
        .limit(1);
      if (existing) return;

      try {
        await db.insert(couponsTable).values(values);
      } catch (err) {
        if (!isUniqueConstraintError(err)) throw err;
      }
    }),
  );

  seedCouponsEnsured = true;
}

export function getCheckoutPrice(): number {
  const raw = Number(process.env.FAIZ_UI_PRICE_IDR);
  return Number.isFinite(raw) && raw > 0 ? raw : FAIZ_UI_PRICE;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isCouponCurrentlyValid(coupon: CouponRow, now = Date.now()): boolean {
  if (!coupon.active) return false;
  if (coupon.expiresAt != null && coupon.expiresAt < now) return false;
  return true;
}

export function computeDiscountedAmount(checkoutPrice: number, coupon: CouponRow): number {
  if (coupon.discountType === 'fixed') {
    return Math.max(0, checkoutPrice - coupon.discountValue);
  }
  const pct = Math.min(100, Math.max(0, coupon.discountValue));
  return Math.max(0, Math.round(checkoutPrice * (1 - pct / 100)));
}

export function formatDiscountLabel(coupon: CouponRow): string {
  return formatCouponDiscount(coupon.discountType, coupon.discountValue);
}

export async function findCouponByCode(
  db: ReturnType<typeof getDb>,
  normalizedCode: string,
): Promise<CouponRow | null> {
  if (!normalizedCode) return null;

  await ensureSeedCoupons(db);

  const [row] = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.code, normalizedCode))
    .limit(1);

  return row ?? null;
}

export async function resolveCoupon(
  db: ReturnType<typeof getDb>,
  rawCode: string,
): Promise<CouponValidation | CouponValidationError> {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { valid: false, error: 'Enter a coupon code.' };
  }

  const coupon = await findCouponByCode(db, code);
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code.' };
  }

  if (!isCouponCurrentlyValid(coupon)) {
    return { valid: false, error: 'This coupon is no longer valid.' };
  }

  const checkoutPrice = getCheckoutPrice();
  const finalAmount = computeDiscountedAmount(checkoutPrice, coupon);

  return {
    valid: true,
    code: coupon.code,
    checkoutPrice,
    finalAmount,
    discountLabel: formatDiscountLabel(coupon),
  };
}
