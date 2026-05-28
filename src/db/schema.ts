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

export const pageSettings = sqliteTable('page_settings', {
  key: text('key').primaryKey(),
  avatarImage: text('avatar_image').notNull(),
  heroImageTop: text('hero_image_top').notNull(),
  heroImageMiddle: text('hero_image_middle').notNull(),
  heroImageBottom: text('hero_image_bottom').notNull(),
});

export const testimonials = sqliteTable('testimonials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  avatar: text('avatar').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  quote: text('quote').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type PageSettingsRow = typeof pageSettings.$inferSelect;
export type NewPageSettingsRow = typeof pageSettings.$inferInsert;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type NewTestimonialRow = typeof testimonials.$inferInsert;
