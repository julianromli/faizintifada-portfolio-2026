import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/** Server-side and scripts only — do not import from React bundles. */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required (Turso libsql URL).');
  }
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient(
    authToken !== undefined ? { url, authToken } : { url },
  );
  return drizzle(client, { schema });
}
