import type {
  CoachingTestimonialRow,
  NewCoachingTestimonialRow,
} from '../db/schema.js';
import type { CoachingTestimonial } from '../types/coaching-testimonial.js';

export function rowToCoachingTestimonial(row: CoachingTestimonialRow): CoachingTestimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    rating: row.rating,
    experience: row.experience,
    outcome: row.outcome ?? undefined,
    agreedToPublish: row.agreedToPublish,
    createdAt: row.createdAt,
  };
}

export function coachingTestimonialPayloadToInsertValues(data: {
  name: string;
  role: string;
  rating: number;
  experience: string;
  outcome?: string;
  agreedToPublish: true;
}): Omit<NewCoachingTestimonialRow, 'id'> {
  return {
    name: data.name,
    role: data.role,
    rating: data.rating,
    experience: data.experience,
    outcome: data.outcome ?? null,
    agreedToPublish: data.agreedToPublish,
    createdAt: Date.now(),
  };
}
