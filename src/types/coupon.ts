export type CouponDiscountType = 'fixed' | 'percent';

export interface Coupon {
  id: number;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  active: boolean;
  expiresAt?: number;
  createdAt: number;
}

export interface CouponValidation {
  valid: true;
  code: string;
  checkoutPrice: number;
  finalAmount: number;
  discountLabel: string;
}

export interface CouponValidationError {
  valid: false;
  error: string;
}

export type ValidateCouponResult = CouponValidation | CouponValidationError;

/** Applied coupon snapshot stored in checkout UI state. */
export type AppliedCoupon = CouponValidation;
