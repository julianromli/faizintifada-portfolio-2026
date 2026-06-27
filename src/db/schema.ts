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

// Orders for the faiz-ui Starter Kit sales page (/ui).
// Schema-only for now: rows are written once the Mayar webhook is wired (nextphase).
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  email: text('email').notNull(),
  mobile: text('mobile'),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('IDR'),
  status: text('status', { enum: ['pending', 'paid', 'refunded'] })
    .notNull()
    .default('pending'),
  // Mayar transaction id; matched against webhook data.transactionId/data.id. Unique to dedupe.
  mayarRef: text('mayar_ref').unique(),
  // Mayar payment-request id from create response; used for the detail re-verify GET /payment/{id}.
  mayarPaymentId: text('mayar_payment_id'),
  createdAt: integer('created_at').notNull(),
  paidAt: integer('paid_at'),
  // Set once the fulfillment email is sent, so webhook retries don't re-send.
  emailSentAt: integer('email_sent_at'),
});

export const coachingSubmissions = sqliteTable('coaching_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  contact: text('contact'),
  os: text('os').notNull(),
  ide: text('ide').notNull(),
  ideOther: text('ide_other'),
  experience: text('experience').notNull(),
  about: text('about').notNull(),
  goal: text('goal').notNull(),
  repoUrl: text('repo_url'),
  agreedToTerms: integer('agreed_to_terms', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at').notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type PageSettingsRow = typeof pageSettings.$inferSelect;
export type NewPageSettingsRow = typeof pageSettings.$inferInsert;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type NewTestimonialRow = typeof testimonials.$inferInsert;
export type CoachingSubmissionRow = typeof coachingSubmissions.$inferSelect;
export type NewCoachingSubmissionRow = typeof coachingSubmissions.$inferInsert;
export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
