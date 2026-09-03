import { z } from 'zod';
import { COACHING_HONEYPOT_FIELD } from '../../src/lib/coaching-options.js';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const coachingPayloadSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(200),
  email: z.string().trim().min(1, 'Email wajib diisi').max(320).email('Email tidak valid'),
  contact: optionalText(200),
  os: z.enum(['mac', 'windows', 'linux']),
  ide: z.enum(['cursor', 'vscode', 'windsurf', 'other']),
  ideOther: optionalText(200),
  experience: z.enum(['beginner', 'experienced', 'optimize']),
  about: z.string().trim().min(1, 'Wajib diisi').max(4000),
  goal: z.string().trim().min(1, 'Wajib diisi').max(4000),
  repoUrl: optionalText(500),
  agreedToTerms: z.literal(true, { message: 'Lo harus menyetujui ketentuan sesi' }),
  // Honeypot: must be empty/absent. Bots fill it; humans never see it.
  [COACHING_HONEYPOT_FIELD]: z
    .string()
    .max(0, 'Spam detected')
    .optional(),
});

export type CoachingPayload = z.infer<typeof coachingPayloadSchema>;
