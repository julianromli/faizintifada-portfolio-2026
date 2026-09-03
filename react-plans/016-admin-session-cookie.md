# 016 — Move admin auth from a stored master secret to an HttpOnly session cookie

- **Status**: TODO
- **Commit**: 318741a (plans 001-015 already applied on top)
- **Severity**: MEDIUM
- **Category**: Security
- **Rule**: react-doctor/auth-token-in-web-storage + Beyond the scan
- **Estimated scope**: 9 files (1 new server module, 1 new hook, 2 deletions), no migration, no new dependency

## Problem

`setAdminToken` writes the **raw `CMS_ADMIN_TOKEN` environment secret** into
`sessionStorage`:

    // src/lib/admin-api.ts:20 — current
    export function setAdminToken(token: string) {
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, normalizeCmsAdminSecret(token));
    }

It is not a derived session token. `src/pages/admin/AdminLogin.tsx:50` tells the
operator to paste `CMS_ADMIN_TOKEN` from the API server, and that exact value is
stored verbatim. It is read back by `getAdminToken()` for every request:

    // src/lib/admin-api.ts:62 — current
    export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
      const token = getAdminToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      ...
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

and sent in **two** headers for uploads:

    // src/lib/admin-api.ts:83 — current
    export function cmsUploadThingHeaders(): HeadersInit {
      const t = getAdminToken();
      if (!t) return {};
      return {
        Authorization: `Bearer ${t}`,
        [CMS_UPLOAD_TOKEN_HEADER]: t,
      };
    }

**Impact.** `sessionStorage` is readable by any JavaScript on the origin, so any
XSS reads the server's master admin secret. That grants full CMS write/delete
across projects, testimonials, speaking events, coupons and page settings; read
access to `GET /api/admin/orders`, which returns Buyer name, email and mobile;
coupon creation, which chains into the free-fulfillment path; and authenticated
UploadThing uploads. Because it is the master secret rather than a session, it
has no expiry and **cannot be revoked server-side** — recovery means changing the
env var and redeploying.

What is already correct and must be preserved: `admin.use('*', …)` in
`server/routes/admin.ts:108` covers every admin route before any handler, and
`src/pages/admin/RequireAdmin.tsx` is only a render gate, which is the right
posture given the server enforces authorization.

## Target

Server-issued, HttpOnly, signed session cookie. The secret is verified once at
login and never enters JavaScript again.

**Design decisions already made — do not revisit:**
- **Stateless signed cookie, not a sessions table.** No migration, no per-request
  DB read.
- **The HMAC key is derived from `CMS_ADMIN_TOKEN` itself.** No new env var, and
  rotating the admin token invalidates every live session — the kill switch.
- **TTL is 12 hours.**
- **Web Crypto (`crypto.subtle`), never `node:crypto`.** This code runs on Node
  (`server/production.ts`), Vercel (`api/[...route].ts`) and Cloudflare Workers
  (`worker/index.ts`). Only Web Crypto is available on all three.

### New file: `server/lib/admin-session.ts`

    import { normalizeCmsAdminSecret } from '../../src/lib/normalize-cms-admin-secret.js';

    export const ADMIN_SESSION_COOKIE = 'admin_session';
    const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

    function b64url(buf: ArrayBuffer): string {
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function fromB64url(s: string): Uint8Array {
      const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
      const bin = atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }

    /** HMAC key bound to the admin secret, so rotating it invalidates all sessions. */
    async function getKey(): Promise<CryptoKey | null> {
      const secret = normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN);
      if (!secret) return null;
      return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(`admin-session:${secret}`),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
      );
    }

    /** Double-HMAC comparison: no early exit on the compared values. */
    export async function safeEqual(a: string, b: string): Promise<boolean> {
      const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const enc = new TextEncoder();
      const [ha, hb] = await Promise.all([
        crypto.subtle.sign('HMAC', key, enc.encode(a)),
        crypto.subtle.sign('HMAC', key, enc.encode(b)),
      ]);
      const x = new Uint8Array(ha);
      const y = new Uint8Array(hb);
      let diff = 0;
      for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
      return diff === 0;
    }

    export function sessionMaxAgeSeconds(): number {
      return Math.floor(SESSION_TTL_MS / 1000);
    }

    export async function createSessionToken(now = Date.now()): Promise<string | null> {
      const key = await getKey();
      if (!key) return null;
      const exp = now + SESSION_TTL_MS;
      const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)).buffer);
      const payload = `${exp}.${nonce}`;
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
      return `${payload}.${b64url(sig)}`;
    }

    export async function verifySessionToken(token: string, now = Date.now()): Promise<boolean> {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const [expRaw, nonce, sig] = parts as [string, string, string];

      const key = await getKey();
      if (!key) return false;

      // Verify the signature BEFORE trusting anything in the payload.
      let ok: boolean;
      try {
        ok = await crypto.subtle.verify(
          'HMAC',
          key,
          fromB64url(sig),
          new TextEncoder().encode(`${expRaw}.${nonce}`),
        );
      } catch {
        return false;
      }
      if (!ok) return false;

      const exp = Number(expRaw);
      return Number.isFinite(exp) && exp > now;
    }

    /** Reads one cookie out of a raw Cookie header (for the UploadThing Request). */
    export function readCookie(cookieHeader: string | null, name: string): string | null {
      if (!cookieHeader) return null;
      for (const part of cookieHeader.split(';')) {
        const eq = part.indexOf('=');
        if (eq === -1) continue;
        if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
      }
      return null;
    }

### New file: `server/lib/origins.ts`

`server/app.ts:35-39` already parses `CORS_ORIGIN`. Extract it so the CSRF origin
check and the CORS config cannot drift apart:

    const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

    export function getAllowedOrigins(): string[] {
      const configured = process.env.CORS_ORIGIN?.split(',').flatMap((s) => {
        const trimmed = s.trim();
        return trimmed ? [trimmed] : [];
      });
      return configured?.length ? configured : devOrigins;
    }

Then `server/app.ts` imports `getAllowedOrigins()` and uses it for `cors({ origin: … })`,
replacing its local `devOrigins`/`corsOrigins` constants. Behaviour is identical.

### `server/routes/admin.ts`

Replace the `bearerAuth` block at `server/routes/admin.ts:108-119`. **The public
routes must be registered BEFORE `admin.use('*', …)`** — Hono dispatches in
registration order, so a handler registered first responds without the middleware
running. Verify this explicitly (see Verification).

    import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
    import {
      ADMIN_SESSION_COOKIE,
      createSessionToken,
      safeEqual,
      sessionMaxAgeSeconds,
      verifySessionToken,
    } from '../lib/admin-session.js';
    import { getAllowedOrigins } from '../lib/origins.js';

    // In-memory login throttle. Serverless invocations do not share this, so on
    // Vercel it is a speed bump rather than a hard limit — still worth having.
    const MAX_LOGIN_ATTEMPTS = 10;
    const LOGIN_WINDOW_MS = 15 * 60 * 1000;
    const loginAttempts = new Map<string, { count: number; resetAt: number }>();

    function clientIp(c: { req: { header: (k: string) => string | undefined } }): string {
      const fwd = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
      return fwd || c.req.header('cf-connecting-ip') || 'unknown';
    }

    function tooManyAttempts(ip: string, now = Date.now()): boolean {
      const entry = loginAttempts.get(ip);
      if (!entry || entry.resetAt < now) return false;
      return entry.count >= MAX_LOGIN_ATTEMPTS;
    }

    function recordFailedAttempt(ip: string, now = Date.now()) {
      const entry = loginAttempts.get(ip);
      if (!entry || entry.resetAt < now) {
        loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
        return;
      }
      entry.count += 1;
    }

    export function createAdminApp() {
      const admin = new Hono();

      // ---- Public routes: registered BEFORE the session middleware. ----

      admin.post('/login', async (c) => {
        const expected = normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN);
        if (!expected) {
          return c.json(
            { error: 'Admin API is not configured. Set CMS_ADMIN_TOKEN in the server environment.' },
            503,
          );
        }

        const ip = clientIp(c);
        if (tooManyAttempts(ip)) {
          return c.json({ error: 'Too many attempts. Try again later.' }, 429);
        }

        let body: { token?: unknown };
        try {
          body = (await c.req.json()) as { token?: unknown };
        } catch {
          return c.json({ error: 'Invalid JSON body' }, 400);
        }

        const provided = normalizeCmsAdminSecret(
          typeof body.token === 'string' ? body.token : '',
        );
        if (!provided || !(await safeEqual(provided, expected))) {
          recordFailedAttempt(ip);
          return c.json({ error: 'Invalid admin token.' }, 401);
        }

        const session = await createSessionToken();
        if (!session) {
          return c.json({ error: 'Could not start a session.' }, 500);
        }

        loginAttempts.delete(ip);
        setCookie(c, ADMIN_SESSION_COOKIE, session, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          path: '/',
          maxAge: sessionMaxAgeSeconds(),
        });
        return c.json({ ok: true });
      });

      admin.post('/logout', (c) => {
        deleteCookie(c, ADMIN_SESSION_COOKIE, { path: '/' });
        return c.json({ ok: true });
      });

      // ---- Everything below this line requires a valid session. ----

      admin.use('*', async (c, next) => {
        if (!normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN)) {
          return c.json(
            { error: 'Admin API is not configured. Set CMS_ADMIN_TOKEN in the server environment.' },
            503,
          );
        }

        // CSRF defence in depth alongside SameSite=Strict: a state-changing request
        // that declares a foreign Origin is rejected outright.
        if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
          const origin = c.req.header('origin');
          if (origin && !getAllowedOrigins().includes(origin)) {
            return c.json({ error: 'Bad origin' }, 403);
          }
        }

        const token = getCookie(c, ADMIN_SESSION_COOKIE);
        if (!token || !(await verifySessionToken(token))) {
          return c.json({ error: 'Not authenticated' }, 401);
        }
        return next();
      });

      /** Used by RequireAdmin/AdminLogin to test whether the session cookie is still valid. */
      admin.get('/session', (c) => c.json({ ok: true }, 200));

      // ... every existing route below, unchanged ...

`bearerAuth` becomes an unused import in this file — remove it.

### `server/uploadthing.ts`

`assertCmsAuth` (`server/uploadthing.ts:8`) stops reading the two custom headers
and verifies the session cookie instead. It becomes **async**, so all five
`.middleware(…)` callbacks must `await` it.

    import { ADMIN_SESSION_COOKIE, readCookie, verifySessionToken } from './lib/admin-session.js';

    async function assertCmsAuth(req: Request) {
      if (!normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN)) {
        throw new UploadThingError({
          code: 'BAD_REQUEST',
          message: 'Server CMS token is not configured',
        });
      }
      const token = readCookie(req.headers.get('cookie'), ADMIN_SESSION_COOKIE);
      if (!token || !(await verifySessionToken(token))) {
        throw new UploadThingError({
          code: 'FORBIDDEN',
          message: 'CMS auth failed: sign in again at /admin.',
        });
      }
    }

and each of the five routes changes from

    .middleware(({ req }) => {
      assertCmsAuth(req);
      return {};
    })

to

    .middleware(async ({ req }) => {
      await assertCmsAuth(req);
      return {};
    })

`CMS_UPLOAD_TOKEN_HEADER` and `tokenFromAuthorizationHeader` become unused here.

### `server/app.ts`

- Use `getAllowedOrigins()` for the `cors({ origin: … })` value.
- Remove `CMS_UPLOAD_TOKEN_HEADER` from `allowHeaders` and drop its import.

### `src/lib/admin-api.ts`

Delete `ADMIN_TOKEN_STORAGE_KEY`, `getAdminToken`, `setAdminToken`,
`clearAdminToken`, `cmsUploadThingHeaders`, the `CMS_UPLOAD_TOKEN_HEADER`
re-export, and `verifyAdminCredentials`. Replace with:

    import { apiUrl } from './api';
    import { normalizeCmsAdminSecret } from './normalize-cms-admin-secret';

    export type AdminLoginResult = { ok: true } | { ok: false; message: string };

    /** Exchanges the admin token for an HttpOnly session cookie. */
    export async function login(rawToken: string): Promise<AdminLoginResult> {
      const normalized = normalizeCmsAdminSecret(rawToken);
      if (!normalized) {
        return { ok: false, message: 'Enter the admin token from your server .env (CMS_ADMIN_TOKEN).' };
      }
      let res: Response;
      try {
        res = await fetch(apiUrl('/api/admin/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: normalized }),
        });
      } catch {
        return { ok: false, message: 'Could not reach the API. Is the server running?' };
      }
      if (res.ok) return { ok: true };
      return { ok: false, message: await readAdminError(res) };
    }

    export async function logout(): Promise<void> {
      try {
        await fetch(apiUrl('/api/admin/logout'), { method: 'POST' });
      } catch {
        // Best effort — the cookie expires on its own.
      }
    }

    /** True when the session cookie is still valid. */
    export async function fetchSession(): Promise<boolean> {
      try {
        const res = await fetch(apiUrl('/api/admin/session'));
        return res.ok;
      } catch {
        return false;
      }
    }

    export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
      const url = apiUrl(path.startsWith('/') ? path : `/${path}`);
      const hasBody = init?.body != null;
      const headers = new Headers(init?.headers);
      if (hasBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...init, headers });
    }

`readAdminError` stays exactly as it is.

**`adminFetch` sets no `credentials` option on purpose**: the API is same-origin
(`vercel.json` rewrites `/api/(.*)`, dev uses the Vite proxy), and `fetch`
defaults to `same-origin`, which sends the cookie. See Boundaries.

### New file: `src/hooks/useAdminSession.ts`

    import { useEffect, useState } from 'react';
    import { fetchSession } from '../lib/admin-api';

    export type AdminSessionStatus = 'checking' | 'authed' | 'anon';

    /** Asks the server whether the HttpOnly session cookie is still valid. */
    export function useAdminSession(): AdminSessionStatus {
      const [status, setStatus] = useState<AdminSessionStatus>('checking');

      useEffect(() => {
        const controller = new AbortController();
        void (async () => {
          const ok = await fetchSession();
          if (!controller.signal.aborted) setStatus(ok ? 'authed' : 'anon');
        })();
        return () => controller.abort();
      }, []);

      return status;
    }

### `src/pages/admin/RequireAdmin.tsx`

    import type { ReactNode } from 'react';
    import { Navigate } from 'react-router-dom';
    import { useAdminSession } from '../../hooks/useAdminSession';

    export function RequireAdmin({ children }: { children: ReactNode }) {
      const status = useAdminSession();

      if (status === 'checking') {
        return <p className="py-12 text-[15px] text-muted animate-pulse">Checking session…</p>;
      }
      if (status === 'anon') {
        return <Navigate to="/admin" replace />;
      }
      return <>{children}</>;
    }

### `src/pages/admin/AdminLogin.tsx`

- Replace the synchronous guard at `:20` (`if (getAdminToken())`) with
  `const status = useAdminSession();` plus
  `if (status === 'authed') return <Navigate to="/admin/projects" replace />;`
  and a `checking` render. Do not block the form on `checking` — a signed-out
  operator should be able to start typing immediately.
- `handleSubmit` calls `login(token)` instead of `verifyAdminCredentials` +
  `setAdminToken`. On `ok`, `navigate('/admin/projects', { replace: true })`.
- Keep every user-facing string, the `type="password"` input, and the styling.

### `src/components/admin/AdminSidebar.tsx`

`clearAdminToken()` at `:28` becomes `await logout()` before the existing
navigation. Make the handler async.

### `src/uploadthing/client.tsx`

Remove the auth `headers` prop wiring if present — the cookie is sent
automatically same-origin. Do not otherwise change the dropzone.

### Deletion

`src/lib/cms-auth-headers.ts` has no remaining importers after the above; delete
it. Confirm with `grep -rn "CMS_UPLOAD_TOKEN_HEADER" src server` first.

## Repo conventions to follow

- Server modules use `.js` extensions on relative imports (ESM/NodeNext) — see
  `server/routes/admin.ts:12`. Client files do not.
- Named React imports; hooks live in `src/hooks/` — `src/hooks/useTheme.ts` is
  the shape to imitate.
- Admin UI styling comes from `src/lib/admin-styles.ts`; do not hand-roll classes.
- Error responses are `c.json({ error: string }, status)`; `readAdminError`
  already unwraps that shape.
- The five `src/lib/*-admin-api.ts` wrappers and the seven admin pages call
  `adminFetch` — **none of them change.**

## Steps

1. Create `server/lib/admin-session.ts` and `server/lib/origins.ts`.
2. Update `server/app.ts` to use `getAllowedOrigins()` and drop
   `CMS_UPLOAD_TOKEN_HEADER` from `allowHeaders`.
3. Rewrite the auth section of `server/routes/admin.ts`: public `/login` and
   `/logout` registered first, then the session middleware, then `/session` and
   every existing route unchanged. Remove the `bearerAuth` import.
4. Update `server/uploadthing.ts`: cookie-based `assertCmsAuth`, `await`ed in all
   five `.middleware(…)` callbacks.
5. Rewrite `src/lib/admin-api.ts` per the target.
6. Add `src/hooks/useAdminSession.ts`.
7. Update `RequireAdmin.tsx`, `AdminLogin.tsx`, `AdminSidebar.tsx`,
   `src/uploadthing/client.tsx`.
8. Delete `src/lib/cms-auth-headers.ts` after confirming no importers remain.
9. Re-read the diff and remove unrelated churn.

## Boundaries

- **Do NOT set `SameSite=None` or add CORS `credentials: true`.** Those are only
  needed for a cross-origin API, and `SameSite=None` gives up the CSRF protection
  this plan depends on. If `VITE_API_URL` or `VITE_UPLOADTHING_URL` is ever
  pointed at a different host, cookie auth breaks — that is a deliberate
  constraint, not a bug. Keep the API same-origin.
- Do NOT add a sessions table, a migration, or any new dependency.
- Do NOT add a new environment variable — the HMAC key derives from `CMS_ADMIN_TOKEN`.
- Do NOT use `node:crypto`; it does not exist on Cloudflare Workers.
- Do NOT change any admin route handler, schema, or DB query.
- Do NOT change the seven admin pages or the five `*-admin-api.ts` wrappers.
- Do NOT change `RequireAdmin`'s role: it stays a UX gate. The server is the
  authority.
- Do NOT alter user-facing copy on the login screen.
- STOP if the code has drifted; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `bun run lint` (`tsc --noEmit`) passes.
  - `bun run build` succeeds.
  - `npx react-doctor@latest --scope changed` — `auth-token-in-web-storage` at
    `src/lib/admin-api.ts:21` clears and the score does not regress.
  - `grep -rn "sessionStorage\|localStorage" src/lib src/pages/admin` returns
    nothing auth-related.

- **Behaviour — auth flow** (`bun run dev`):
  1. Visit `/admin` signed out → login form. Paste a **wrong** token → "Invalid
     admin token.", and no cookie is set.
  2. Paste the correct `CMS_ADMIN_TOKEN` → redirected to `/admin/projects`.
  3. DevTools → Application → Cookies: `admin_session` exists with **HttpOnly ✓,
     Secure ✓, SameSite=Strict**. In the Console, `document.cookie` must **not**
     contain it.
  4. Console: `sessionStorage.getItem('portfolio_cms_admin_token')` → `null`.
  5. Reload a deep admin route (`/admin/coupons`) → stays signed in after the
     brief "Checking session…" render.
  6. Edit and save a project, a coupon, and page settings → all succeed.
  7. Upload an image in the project form → succeeds (cookie-authed UploadThing).
  8. Sign out from the sidebar → cookie gone, redirected to `/admin`, and a
     direct visit to `/admin/coupons` bounces to the login form.

- **Behaviour — the login route is reachable while signed out.** This is the one
  ordering trap in the plan. With no cookie set, `POST /api/admin/login` must
  return 401 for a bad token and 200 for a good one — **not** 401 from the session
  middleware. If it always 401s, the public routes were registered after
  `admin.use('*', …)`.

- **Security checks (not optional):**
  - **Protected routes reject an anonymous request**:
    `curl -i http://localhost:3000/api/admin/orders` → 401.
  - **The old header path is dead**:
    `curl -i -H "Authorization: Bearer $CMS_ADMIN_TOKEN" http://localhost:3000/api/admin/orders`
    → **401**. A 200 here means the bearer middleware was left in place and
    nothing was actually fixed.
  - **CSRF origin check**: replay a valid cookie-bearing mutation with a foreign
    Origin —
    `curl -i -X POST -H "Origin: https://evil.example" -H "Cookie: admin_session=<paste from DevTools>" http://localhost:3000/api/admin/logout`
    → 403. (Use any non-GET admin route; `logout` is public, so pick a protected
    one such as `POST /api/admin/coupons`.)
  - **Expiry**: temporarily set `SESSION_TTL_MS` to `10_000`, sign in, wait 15
    seconds, reload an admin route → bounced to login. Restore the constant.
  - **Rotation invalidates sessions**: sign in, change `CMS_ADMIN_TOKEN` in the
    server env, restart the API, reload an admin route → bounced to login.
  - **Login throttle**: POST 11 wrong tokens in a row → the 11th returns 429.

- **Cross-runtime**: `bun run cf:dev` (Workers) and a Vercel preview deploy must
  both complete the sign-in → edit → sign-out flow. Web Crypto and `hono/cookie`
  work on all three, but confirm rather than assume — this is the highest-risk
  part of the change after CSRF.

- **Done when**: the diagnostic is clear, no admin secret is reachable from
  JavaScript, the Bearer path returns 401, the foreign-Origin mutation returns
  403, sessions expire at 12h and die on token rotation, uploads still work, and
  all three runtimes pass the flow.

## What this does NOT fix

Still a single shared secret with no per-user identity, and the stateless design
has no per-session revocation — rotating `CMS_ADMIN_TOKEN` is the only kill
switch, which invalidates every session at once. The login throttle is in-memory,
so on Vercel it does not span invocations. Adding a CSP via `hono/secure-headers`
(a separate, still-open finding) remains the complementary mitigation.
