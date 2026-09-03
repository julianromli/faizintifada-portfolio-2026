import { z } from 'zod';

export const checkoutPayloadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(320)
    .email('Invalid email'),
  mobile: z.string().trim().min(6, 'WhatsApp number is required').max(40),
  couponCode: z.string().trim().max(64).optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;
