import { z } from 'zod';
import {
  normalizeBgClassPreset,
  PROJECT_BG_PRESET_KEYS,
} from '../../src/lib/project-bg-presets.js';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const bgClassSchema = z
  .string()
  .min(1)
  .transform(normalizeBgClassPreset)
  .pipe(z.enum(PROJECT_BG_PRESET_KEYS));

export const projectPayloadSchema = z.object({
  slug: z
    .string()
    .regex(slugRegex, 'Use lowercase letters, numbers, and single hyphens between segments'),
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  image: z.string().min(1),
  tags: z.array(z.string().min(1)),
  bgClass: bgClassSchema,
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

export function updateProjectPayloadSchema() {
  return projectPayloadSchema;
}
