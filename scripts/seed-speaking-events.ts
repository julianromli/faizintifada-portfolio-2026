import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { speakingEvents as speakingEventsTable } from '../src/db/schema';
import { speakingEventToInsertValues } from '../src/lib/speaking-event-mapper';
import { seedSpeakingEvents } from '../src/data/speakingEvents';

async function main() {
  const db = getDb();

  for (const item of seedSpeakingEvents) {
    const values = speakingEventToInsertValues(item);
    const existing = await db
      .select({ id: speakingEventsTable.id })
      .from(speakingEventsTable)
      .where(eq(speakingEventsTable.title, item.title))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(speakingEventsTable)
        .set(values)
        .where(eq(speakingEventsTable.id, existing[0]!.id));
    } else {
      await db.insert(speakingEventsTable).values(values);
    }
  }

  console.log(`Seeded ${seedSpeakingEvents.length} speaking event(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
