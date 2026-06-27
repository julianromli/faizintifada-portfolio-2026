import { apiUrl } from './api';
import type { ValidateCouponResult } from '../types/coupon';

export interface CheckoutInput {
  name: string;
  email: string;
  mobile: string;
  couponCode?: string;
}

export type CreateCheckoutResult =
  | { ok: true; link: string }
  | { ok: false; message: string };

function isValidateCouponResult(value: unknown): value is ValidateCouponResult {
  if (!value || typeof value !== 'object') return false;
  if ('valid' in value && value.valid === true) {
    return (
      typeof (value as { code?: unknown }).code === 'string' &&
      typeof (value as { finalAmount?: unknown }).finalAmount === 'number'
    );
  }
  if ('valid' in value && value.valid === false) {
    return typeof (value as { error?: unknown }).error === 'string';
  }
  return false;
}

/** Public, unauthenticated. Validates a coupon and returns the discounted price. */
export async function validateCoupon(code: string): Promise<ValidateCouponResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/coupon/validate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { valid: false, error: 'Could not reach the server. Please try again.' };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { valid: false, error: 'Could not validate coupon. Please try again.' };
  }

  if (isValidateCouponResult(data)) {
    return data;
  }

  if (!res.ok && data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string') {
    return { valid: false, error: (data as { error: string }).error };
  }

  return { valid: false, error: 'Could not validate coupon. Please try again.' };
}

/** Public, unauthenticated. Creates a Mayar payment and returns its hosted checkout link. */
export async function createCheckout(input: CheckoutInput): Promise<CreateCheckoutResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: 'Could not reach the server. Please try again.' };
  }

  if (res.ok) {
    const data = (await res.json().catch(() => null)) as { link?: string } | null;
    if (data?.link) {
      return { ok: true, link: data.link };
    }
    return { ok: false, message: 'Checkout did not return a payment link.' };
  }

  let message =
    res.status === 503
      ? 'Checkout is not available right now. Please try again later.'
      : 'Failed to start checkout. Please try again.';
  try {
    const j = (await res.json()) as { error?: string };
    if (typeof j.error === 'string') message = j.error;
  } catch {
    // keep default
  }
  return { ok: false, message };
}
