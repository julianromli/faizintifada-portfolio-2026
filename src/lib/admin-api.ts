import { apiUrl } from './api';
import { CMS_UPLOAD_TOKEN_HEADER } from './cms-auth-headers';
import { normalizeCmsAdminSecret } from './normalize-cms-admin-secret';

export { CMS_UPLOAD_TOKEN_HEADER } from './cms-auth-headers';

export const ADMIN_TOKEN_STORAGE_KEY = 'portfolio_cms_admin_token';

export function getAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (raw === null) return null;
    const t = normalizeCmsAdminSecret(raw);
    return t || null;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, normalizeCmsAdminSecret(token));
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export type VerifyAdminCredentialsResult =
  | { ok: true }
  | { ok: false; message: string };

/** Calls GET /api/admin/session with the candidate token (must match CMS_ADMIN_TOKEN on the API). */
export async function verifyAdminCredentials(rawToken: string): Promise<VerifyAdminCredentialsResult> {
  const normalized = normalizeCmsAdminSecret(rawToken);
  if (!normalized) {
    return {
      ok: false,
      message: 'Enter the admin token from your server .env (CMS_ADMIN_TOKEN).',
    };
  }
  const url = apiUrl('/api/admin/session');
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${normalized}`,
      },
    });
  } catch {
    return {
      ok: false,
      message: 'Could not reach the API. Is the server running?',
    };
  }
  if (res.ok) {
    return { ok: true };
  }
  const message = await readAdminError(res);
  return { ok: false, message };
}

export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  const url = apiUrl(path.startsWith('/') ? path : `/${path}`);
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

/** Headers for `@uploadthing/react` `headers` prop (function form). */
export function cmsUploadThingHeaders(): HeadersInit {
  const t = getAdminToken();
  if (!t) return {};
  return {
    Authorization: `Bearer ${t}`,
    [CMS_UPLOAD_TOKEN_HEADER]: t,
  };
}

export async function readAdminError(res: Response): Promise<string> {
  let msg = res.statusText || `Request failed (${res.status})`;
  try {
    const j = (await res.json()) as { error?: string; details?: unknown };
    if (typeof j.error === 'string') {
      msg = j.error;
    }
  } catch {
    /* empty */
  }
  return msg;
}
