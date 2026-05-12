import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { projects as projectsTable } from '../src/db/schema';
import { projectToInsertValues } from '../src/lib/project-mapper';
import { seedProjects } from '../src/data/projects';

async function main() {
  const db = getDb();

  for (let i = 0; i < seedProjects.length; i++) {
    const p = seedProjects[i];
    const values = projectToInsertValues(p, { featured: true, sortOrder: i });
    const existing = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.slug, p.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(projectsTable)
        .set(values)
        .where(eq(projectsTable.slug, p.slug));
    } else {
      await db.insert(projectsTable).values(values);
    }
  }

  console.log(`Seeded ${seedProjects.length} project(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
