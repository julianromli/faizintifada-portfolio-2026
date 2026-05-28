import type { NewTestimonialRow, TestimonialRow } from '../db/schema.js';
import type { Testimonial } from '../types/testimonial.js';

export function rowToTestimonial(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    avatar: row.avatar,
    name: row.name,
    role: row.role,
    quote: row.quote,
    sortOrder: row.sortOrder,
  };
}

export function testimonialToInsertValues(
  data: Omit<Testimonial, 'id'>,
): Omit<NewTestimonialRow, 'id'> {
  return {
    avatar: data.avatar,
    name: data.name,
    role: data.role,
    quote: data.quote,
    sortOrder: data.sortOrder,
  };
}
