import { apiUrl } from './api';

export const ADMIN_TOKEN_STORAGE_KEY = 'portfolio_cms_admin_token';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
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
