import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { projects as projectsTable } from '../src/db/schema';
import { normalizeBgClassPreset } from '../src/lib/project-bg-presets';

async function main() {
  const db = getDb();
  const rows = await db.select().from(projectsTable);

  let updated = 0;
  for (const row of rows) {
    const normalized = normalizeBgClassPreset(row.bgClass);
    if (normalized !== row.bgClass) {
      await db
        .update(projectsTable)
        .set({ bgClass: normalized })
        .where(eq(projectsTable.id, row.id));
      console.log(`  ${row.slug}: ${row.bgClass} → ${normalized}`);
      updated++;
    }
  }

  console.log(`Migrated ${updated} of ${rows.length} project(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
