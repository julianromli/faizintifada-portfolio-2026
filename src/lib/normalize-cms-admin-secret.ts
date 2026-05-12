/** Strip BOM, trim, and remove accidental leading "Bearer " prefixes (common paste mistake). */
export function normalizeCmsAdminSecret(raw: string | undefined | null): string {
  if (!raw) return '';
  let t = raw.trim();
  if (t.charCodeAt(0) === 0xfeff) {
    t = t.slice(1).trim();
  }
  while (/^Bearer\s+/i.test(t)) {
    t = t.replace(/^Bearer\s+/i, '').trim();
  }
  return t;
}

/** Value after the first `Bearer ` prefix, or the whole header if missing (Hono-style). */
export function tokenFromAuthorizationHeader(header: string | null | undefined): string {
  if (!header) return '';
  const t = header.trim();
  const prefix = 'Bearer ';
  const lower = t.toLowerCase();
  if (lower.startsWith(prefix.toLowerCase()) && t.length > prefix.length) {
    return t.slice(prefix.length).trimStart();
  }
  return t;
}
