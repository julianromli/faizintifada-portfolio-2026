import { z } from 'zod';

export const validateCouponPayloadSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(64),
});

export const couponPayloadSchema = z
  .object({
    code: z.string().trim().min(1, 'Code is required').max(64),
    discountType: z.enum(['fixed', 'percent']),
    discountValue: z.number().int().positive('Discount must be greater than zero'),
    active: z.boolean(),
    expiresAt: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'percent' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage cannot exceed 100',
        path: ['discountValue'],
      });
    }
  });

export type CouponPayload = z.infer<typeof couponPayloadSchema>;
