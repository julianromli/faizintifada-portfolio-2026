// Minimal Mayar Headless API client for the faiz-ui checkout.
// Docs: https://docs.mayar.id/api-reference/reqpayment/create
// Sandbox base: https://api.mayar.club/hl/v1 — Production: https://api.mayar.id/hl/v1

const SANDBOX_BASE = 'https://api.mayar.club/hl/v1';
const PRODUCTION_BASE = 'https://api.mayar.id/hl/v1';

function getBaseUrl(): string {
  const explicit = process.env.MAYAR_API_BASE?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  // Default to sandbox unless MAYAR_ENV is explicitly "production".
  return process.env.MAYAR_ENV?.trim() === 'production' ? PRODUCTION_BASE : SANDBOX_BASE;
}

function getApiKey(): string {
  const key = process.env.MAYAR_API_KEY?.trim();
  if (!key) {
    throw new Error('MAYAR_API_KEY is not set');
  }
  return key;
}

export interface CreatePaymentInput {
  name: string;
  email: string;
  amount: number;
  mobile?: string;
  description?: string;
  redirectUrl?: string;
  /** ISO timestamp; link is invalid after this. */
  expiredAt?: string;
}

export interface CreatePaymentResult {
  id: string;
  transactionId: string;
  link: string;
}

/** Create a single payment request. Returns the hosted checkout link + ids. */
export async function createPayment(
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  const res = await fetch(`${getBaseUrl()}/payment/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = (await res.json().catch(() => null)) as
    | { statusCode?: number; messages?: string; data?: Partial<CreatePaymentResult> }
    | null;

  if (!res.ok || !json?.data?.link) {
    throw new Error(
      `Mayar create payment failed (${res.status}): ${json?.messages ?? 'unknown error'}`,
    );
  }

  const data = json.data;
  return {
    id: String(data.id ?? ''),
    transactionId: String(data.transactionId ?? data.id ?? ''),
    link: String(data.link),
  };
}

export interface MayarPaymentDetail {
  id: string;
  status: string;
  amount: number;
}

/** Fetch a single payment request to confirm it is actually paid (webhook has no signature). */
export async function getPayment(id: string): Promise<MayarPaymentDetail | null> {
  const res = await fetch(`${getBaseUrl()}/payment/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: { id?: string; status?: string; amount?: number } }
    | null;

  if (!res.ok || !json?.data) return null;

  return {
    id: String(json.data.id ?? id),
    status: String(json.data.status ?? '').toLowerCase(),
    amount: Number(json.data.amount ?? 0),
  };
}

/** Mayar payment detail status that is NOT yet paid. */
export function isPaidStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s !== '' && s !== 'unpaid' && s !== 'created' && s !== 'expired' && s !== 'closed';
}
