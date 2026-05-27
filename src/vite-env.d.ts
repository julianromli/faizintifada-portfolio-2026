/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Canonical site URL for SEO metadata (no trailing slash). */
  readonly VITE_SITE_URL?: string;
  /** Optional: API origin when uploads are served from a different host than the SPA (omit in dev; use same-origin `/api/uploadthing` via Vite proxy). */
  readonly VITE_UPLOADTHING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
