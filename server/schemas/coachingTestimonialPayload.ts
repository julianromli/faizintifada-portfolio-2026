import { z } from 'zod';
import {
  COACHING_TESTIMONIAL_HONEYPOT_FIELD,
  COACHING_TESTIMONIAL_MAX_RATING,
  COACHING_TESTIMONIAL_MIN_RATING,
} from '../../src/lib/coaching-testimonial-options.js';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const coachingTestimonialPayloadSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(200),
    role: z.string().trim().min(1, 'Role wajib diisi').max(200),
    rating: z
      .number()
      .int('Rating tidak valid')
      .min(COACHING_TESTIMONIAL_MIN_RATING, 'Rating tidak valid')
      .max(COACHING_TESTIMONIAL_MAX_RATING, 'Rating tidak valid'),
    experience: z.string().trim().min(1, 'Wajib diisi').max(4000),
    outcome: optionalText(4000),
    agreedToPublish: z.literal(true, {
      message: 'Lo harus mengizinkan testimoni ditampilkan',
    }),
    // Honeypot: must be empty/absent. Bots fill it; humans never see it.
    [COACHING_TESTIMONIAL_HONEYPOT_FIELD]: z
      .string()
      .max(0, 'Spam detected')
      .optional(),
  })
  .strip();

export type CoachingTestimonialPayload = z.infer<typeof coachingTestimonialPayloadSchema>;
