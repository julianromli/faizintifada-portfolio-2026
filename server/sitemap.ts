import { asc } from 'drizzle-orm';
import { getDb } from '../src/db/client.js';
import { projects as projectsTable } from '../src/db/schema.js';

function getSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim() || process.env.VITE_SITE_URL?.trim();
  const fallback = 'https://faizintifada.com';
  if (!raw) return fallback;
  return raw.replace(/\/$/, '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function buildSitemapXml(): Promise<string> {
  const siteUrl = getSiteUrl();
  const db = getDb();
  const rows = await db
    .select({ slug: projectsTable.slug })
    .from(projectsTable)
    .orderBy(asc(projectsTable.sortOrder), asc(projectsTable.slug));

  const staticPaths = ['/', '/projects'];
  const urls = [
    ...staticPaths.map((path) => ({
      loc: `${siteUrl}${path === '/' ? '' : path}`,
    })),
    ...rows.map((row) => ({
      loc: `${siteUrl}/project/${row.slug}`,
    })),
  ];

  const body = urls
    .map(({ loc }) => `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
