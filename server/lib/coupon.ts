import { eq } from 'drizzle-orm';
import { coupons as couponsTable, type CouponRow } from '../../src/db/schema.js';
import { getDb } from '../../src/db/client.js';
import { formatCouponDiscount } from '../../src/lib/format-coupon.js';
import type { CouponValidation, CouponValidationError } from '../../src/types/coupon.js';

const FAIZ_UI_PRICE = 99000;

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
