import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectPayloadSchema = z.object({
  slug: z
    .string()
    .regex(slugRegex, 'Use lowercase letters, numbers, and single hyphens between segments'),
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  image: z.string().min(1),
  tags: z.array(z.string().min(1)),
  bgClass: z.string().min(1),
  imagePosition: z.string().optional(),
  client: z.string().optional(),
  role: z.string().optional(),
  timeline: z.string().optional(),
  liveUrl: z.string().optional(),
  images: z.array(z.string().min(1)).optional(),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export type ProjectPayload = z.infer<typeof projectPayloadSchema>;

export function updateProjectPayloadSchema(urlSlug: string) {
  return projectPayloadSchema.refine((d) => d.slug === urlSlug, {
    message: 'Slug in body must match the URL (slug cannot be changed).',
    path: ['slug'],
  });
}
