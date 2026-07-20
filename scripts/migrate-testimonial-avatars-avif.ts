/**
 * One-off / repeatable: download hero testimonial avatars, convert to 96×96 AVIF,
 * upload via UploadThing UTApi, update DB URLs.
 *
 * Usage: bun scripts/migrate-testimonial-avatars-avif.ts
 * Requires: DATABASE_URL, UPLOADTHING_TOKEN (and DATABASE_AUTH_TOKEN if Turso).
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { UTApi, UTFile } from 'uploadthing/server';
import { getDb } from '../src/db/client';
import { testimonials as testimonialsTable } from '../src/db/schema';

const SIZE = 96;
/** Matches client compressTestimonialAvatars AVIF quality (~0.6). */
const AVIF_QUALITY = 60;

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'avatar';
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function toAvif(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .avif({ quality: AVIF_QUALITY })
    .toBuffer();
}

function uploadedUrl(data: { ufsUrl: string }): string {
  return data.ufsUrl;
}

async function main() {
  if (!process.env.UPLOADTHING_TOKEN?.trim()) {
    throw new Error('UPLOADTHING_TOKEN is required');
  }

  const db = getDb();
  const utapi = new UTApi();
  const rows = await db.select().from(testimonialsTable);

  if (rows.length === 0) {
    console.log('No testimonials found.');
    return;
  }

  console.log(`Migrating ${rows.length} testimonial avatar(s) → ${SIZE}×${SIZE} AVIF…`);

  for (const row of rows) {
    const label = `${row.id} ${row.name}`;
    if (row.avatar.toLowerCase().endsWith('.avif')) {
      console.log(`skip  ${label} (already .avif URL)`);
      continue;
    }

    process.stdout.write(`… ${label} `);
    const original = await download(row.avatar);
    const avif = await toAvif(original);
    const file = new UTFile([avif], `${slugify(row.name)}-avatar.avif`, {
      type: 'image/avif',
    });
    const result = await utapi.uploadFiles(file);
    if (result.error) {
      throw new Error(`Upload failed for ${label}: ${result.error.message}`);
    }
    if (!result.data) {
      throw new Error(`Upload failed for ${label}: empty response`);
    }

    const nextUrl = uploadedUrl(result.data);
    await db
      .update(testimonialsTable)
      .set({ avatar: nextUrl })
      .where(eq(testimonialsTable.id, row.id));

    console.log(
      `ok (${original.length}B → ${avif.length}B) ${nextUrl}`,
    );
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
