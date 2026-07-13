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

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || isHttpUrl(v), 'Use a valid http(s) URL')
  .optional();

export const speakingEventPayloadSchema = z.object({
  image: imageUrlSchema,
  title: z.string().trim().min(1).max(300),
  eventType: z.enum(['offline', 'webinar']),
  organizer: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  eventDate: z.string().trim().max(100).optional(),
  audienceCount: z.number().int().min(0).max(10_000_000).optional(),
  link: optionalUrlSchema,
  featured: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export type SpeakingEventPayload = z.infer<typeof speakingEventPayloadSchema>;
