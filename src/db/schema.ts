import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description').notNull(),
  image: text('image').notNull(),
  tagsJson: text('tags_json').notNull(),
  bgClass: text('bg_class').notNull(),
  imagePosition: text('image_position'),
  client: text('client'),
  role: text('role'),
  timeline: text('timeline'),
  liveUrl: text('live_url'),
  imagesJson: text('images_json'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
