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

export const pageSettingsPayloadSchema = z.object({
  avatarImage: imageUrlSchema,
  heroImageTop: imageUrlSchema,
  heroImageMiddle: imageUrlSchema,
  heroImageBottom: imageUrlSchema,
});

export type PageSettingsPayload = z.infer<typeof pageSettingsPayloadSchema>;
