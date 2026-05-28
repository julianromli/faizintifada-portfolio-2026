import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { testimonials as testimonialsTable } from '../src/db/schema';
import { testimonialToInsertValues } from '../src/lib/testimonial-mapper';
import { seedTestimonials } from '../src/data/testimonials';

async function main() {
  const db = getDb();

  for (const item of seedTestimonials) {
    const values = testimonialToInsertValues(item);
    const existing = await db
      .select({ id: testimonialsTable.id })
      .from(testimonialsTable)
      .where(eq(testimonialsTable.name, item.name))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(testimonialsTable)
        .set(values)
        .where(eq(testimonialsTable.id, existing[0]!.id));
    } else {
      await db.insert(testimonialsTable).values(values);
    }
  }

  console.log(`Seeded ${seedTestimonials.length} testimonial(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
