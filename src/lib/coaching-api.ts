import { apiUrl } from './api';
import { COACHING_HONEYPOT_FIELD } from './coaching-options';
import type { CoachingSubmissionInput } from '../types/coaching';

export type SubmitCoachingResult =
  | { ok: true }
  | { ok: false; message: string };

/** Public, unauthenticated submission. `honeypot` should be the hidden field value (empty for humans). */
export async function submitCoaching(
  input: CoachingSubmissionInput,
  honeypot: string,
): Promise<SubmitCoachingResult> {
  const url = apiUrl('/api/coaching');
  const payload: Record<string, unknown> = {
    ...input,
    [COACHING_HONEYPOT_FIELD]: honeypot,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: 'Tidak bisa terhubung ke server. Coba lagi.' };
  }

  if (res.ok) {
    return { ok: true };
  }

  let message = 'Gagal mengirim. Coba lagi.';
  try {
    const j = (await res.json()) as { error?: string };
    if (typeof j.error === 'string') {
      message = j.error;
    }
  } catch {
    // keep default
  }
  return { ok: false, message };
}
