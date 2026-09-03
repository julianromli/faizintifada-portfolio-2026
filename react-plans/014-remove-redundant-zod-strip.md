# 014 — Remove the redundant `.strip()` calls from the Zod schemas

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: LOW
- **Category**: Maintainability & architecture
- **Rule**: react-doctor/zod-v4-no-deprecated-schema-apis (×5)
- **Estimated scope**: 4 files, 5 lines

## Problem

React Doctor reports `zod-v4-no-deprecated-schema-apis` five times. The flagged
API in each case is `.strip()`, chained onto a `z.object({...})` factory
expression:

    // server/schemas/checkoutPayload.ts:3 — current
    export const checkoutPayloadSchema = z
      .object({
        name: z.string().trim().min(1, 'Name is required').max(200),
        // ...
      })
      .strip();

    // server/schemas/couponPayload.ts:3 — current
    export const validateCouponPayloadSchema = z
      .object({
        code: z.string().trim().min(1, 'Coupon code is required').max(64),
      })
      .strip();

The other three are the same shape:
- `server/schemas/coachingPayload.ts:12`
- `server/schemas/coachingTestimonialPayload.ts:16`
- `server/schemas/couponPayload.ts:9` (`.strip().superRefine(...)`)

`.strip()` is a Zod 3-era method that resets an object schema to the **default**
unknown-key behaviour. Object schemas have stripped unknown keys by default since
Zod 2, and this project is already on `zod@^4.4.3` (`package.json`). So every one
of these calls is a no-op that Zod 4 deprecates in favour of the
`z.strictObject()` / `z.looseObject()` family.

**Impact**: no runtime defect today — this is why the finding is LOW. The value is
that it removes five of the repo's 55 diagnostics for a zero-behaviour-change
edit, and removes a call that a future Zod minor may drop entirely, on the
checkout and coaching request paths.

## Target

Delete the `.strip()` call. Do not substitute anything: stripping is already the
default, so the schema's behaviour is byte-for-byte identical and the inferred
`z.infer<...>` types are unchanged.

    // target — server/schemas/checkoutPayload.ts:3
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

    // target — server/schemas/couponPayload.ts:3
    export const validateCouponPayloadSchema = z.object({
      code: z.string().trim().min(1, 'Coupon code is required').max(64),
    });

    // target — server/schemas/couponPayload.ts:9 (keep .superRefine)
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

Same deletion in `server/schemas/coachingPayload.ts:12` and
`server/schemas/coachingTestimonialPayload.ts:16` — remove `.strip()`, keep
everything else including the honeypot fields and the `optionalText` helper.

Where removing `.strip()` leaves a bare `z.object({...})` with nothing chained
after it, collapse the `z\n  .object({` continuation onto one line as shown
above. Where something is still chained (`couponPayload.ts:9`), keep the existing
multi-line chain formatting.

**This plan does not touch the other deprecated Zod 3 idioms** in these files —
`z.string().email()` (Zod 4 prefers top-level `z.email()`) and
`z.ZodIssueCode.custom` (Zod 4 prefers the string literal `"custom"`). React
Doctor does not flag them at these lines, they still work in Zod 4, and changing
validation-message behaviour on the checkout path is out of scope here.

## Repo conventions to follow

- Server schema files export both the schema and its `z.infer` type alias; keep
  both and keep the exported names identical.
- Validation messages are English in `checkoutPayload`/`couponPayload` and
  Indonesian in the two coaching schemas. **Do not translate or reword any message.**
- Two-space indentation, single quotes, trailing commas — match the surrounding lines.

## Steps

1. `server/schemas/checkoutPayload.ts` — remove `.strip()` at line 15, collapse
   the `z.object(` continuation.
2. `server/schemas/coachingPayload.ts` — remove `.strip()` at line 31, collapse.
3. `server/schemas/coachingTestimonialPayload.ts` — remove `.strip()` at line 36,
   collapse.
4. `server/schemas/couponPayload.ts` — remove `.strip()` from **both** schemas
   (lines 7 and 17); collapse only `validateCouponPayloadSchema`, since
   `couponPayloadSchema` still chains `.superRefine`.
5. Re-read the diff. It must contain nothing but `.strip()` removals and the
   whitespace those removals imply.

## Boundaries

- Do NOT replace `.strip()` with `z.strictObject()` or `z.looseObject()` — those
  change unknown-key behaviour from "strip" to "reject" or "keep", which would be
  a real behaviour change on live request paths.
- Do NOT change `z.string().email()`, `z.ZodIssueCode.custom`, `z.literal(...)`,
  any `.min`/`.max` bound, or any message string.
- Do NOT touch the route handlers in `server/routes/**` or `server/app.ts`.
- Do NOT upgrade or change the `zod` dependency version.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — all five
    `zod-v4-no-deprecated-schema-apis` diagnostics clear and the score does not regress.
  - `bun run lint` (`tsc --noEmit`) passes. The inferred payload types must be
    unchanged; a type error anywhere in `server/routes/**` means something more
    than `.strip()` was removed.
- **Behavior check (unknown-key stripping must still happen)**: with the API
  running (`bun run dev:api`), POST to each affected endpoint with a **valid body
  plus an extra unknown field** and confirm the request still succeeds and the
  unknown field is not persisted:
  - `POST /api/checkout` with an extra `"amount": 1` field — this is the important
    one. It must be stripped, so the charged amount stays server-derived. Verify
    the created order's amount in the DB (`bun run db:studio`) is the real
    checkout price, not 1.
  - `POST /api/coaching` and `POST /api/coaching-testimonials` with an extra field
    — both must succeed and store only the schema's fields.
  - `POST /api/coupon/validate` with an extra field — must succeed.
  Then POST a body **missing** a required field to each and confirm the same
  validation error message as before.
- **Done when**: the five diagnostics are clear, the score is not lower, typecheck
  passes, unknown keys are still stripped (especially on `/api/checkout`), and
  validation messages are unchanged.
