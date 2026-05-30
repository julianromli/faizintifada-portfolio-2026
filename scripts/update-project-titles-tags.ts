import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { projects } from '../src/db/schema';

const updates: Record<
  string,
  {
    title: string;
    tagsJson: string;
  }
> = {
  isometricon: {
    title: 'Isometricon — AI 3D Icons Generator',
    tagsJson: JSON.stringify(['SaaS', 'AI', '3D', 'Next.js']),
  },
  'absenin-id': {
    title: 'Absenin.id — QR & Face-ID Attendance Platform',
    tagsJson: JSON.stringify(['SaaS', 'Mobile', 'Face ID', 'HR Tech']),
  },
  'voucher-kalanaraspa': {
    title: 'Kalanara Spa — Digital Voucher & Booking',
    tagsJson: JSON.stringify(['E-Commerce', 'Web Design', 'Payments']),
  },
};

async function main() {
  const db = getDb();

  for (const [slug, patch] of Object.entries(updates)) {
    const result = await db
      .update(projects)
      .set(patch)
      .where(eq(projects.slug, slug))
      .returning({ slug: projects.slug, title: projects.title, tagsJson: projects.tagsJson });

    if (result.length === 0) {
      console.warn(`  skip: slug not found — ${slug}`);
    } else {
      console.log(`  updated: ${slug} → ${result[0].title} [${result[0].tagsJson}]`);
    }
  }

  console.log('Project titles & tags update complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
