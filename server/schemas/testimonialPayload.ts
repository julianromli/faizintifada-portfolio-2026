import { z } from 'zod';

function isHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Image URL is required')
  .refine(isHttpUrl, 'Use a valid http(s) image URL');

export const testimonialPayloadSchema = z.object({
  avatar: imageUrlSchema,
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  quote: z.string().trim().min(1).max(2000),
  sortOrder: z.number().int().min(0),
});

export type TestimonialPayload = z.infer<typeof testimonialPayloadSchema>;
