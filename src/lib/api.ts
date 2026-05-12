/** Base URL for API in production (trailing slash stripped). Dev uses same-origin + Vite proxy. */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
