import { apiUrl } from './api';

export interface CheckoutInput {
  name: string;
  email: string;
  mobile: string;
}

export type CreateCheckoutResult =
  | { ok: true; link: string }
  | { ok: false; message: string };

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
