# 006 — Restore a visible focus ring on the primary CTAs

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Accessibility
- **Rule**: react-doctor/no-outline-none
- **Estimated scope**: 1 file (CSS), ~8 lines

## Problem

`.btn-embossed` is the app's primary-button style. It defines `:hover` and
`:active` states and **no focus state at all** — verified: the whole
`.btn-embossed` block contains zero `focus-visible` rules.

    /* src/index.css:223 — current */
      .btn-embossed {
        background: linear-gradient(180deg, #2a2a2a 0%, #111111 100%);
        box-shadow:
          inset 0px 1px 1px rgba(255, 255, 255, 0.15),
          inset 0px -2px 4px rgba(0, 0, 0, 0.6),
          0px 6px 12px rgba(0, 0, 0, 0.25),
          0px 2px 4px rgba(0, 0, 0, 0.15);
        border: 1px solid #000;
        transition: transform 160ms var(--ease-out), box-shadow 160ms var(--ease-out), background 160ms var(--ease-out);
      }
      .btn-embossed:hover { /* ... */ }
      .btn-embossed:active { /* ... */ }

Every element that uses it also adds `focus:outline-none`, removing the UA ring
with nothing to replace it. Three of them are the app's most important controls:

    // src/components/CheckoutDialog.tsx:312 — the "Continue to payment" submit
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-embossed px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60 disabled:pointer-events-none focus:outline-none"

    // src/components/AboutSection.tsx:53 — homepage conversion CTA
                    className="inline-block text-white px-8 py-3.5 rounded-full font-medium text-[15px] btn-embossed focus:outline-none"

    // src/pages/UiKitThankYou.tsx:55 — the only action on the post-purchase page
                className="inline-flex items-center gap-2 rounded-full btn-embossed px-8 py-4 text-[15px] font-medium text-white focus:outline-none"

**User impact**: a keyboard user tabbing through the checkout form cannot see
where focus is when it reaches the submit button — the single most important
control in the app. This is a WCAG 2.4.7 (Focus Visible) failure on the revenue
path.

Note this is a genuine outlier, not the house style: every other interactive
element in the codebase pairs `focus:outline-none` with an explicit
`focus-visible:ring-2` (see `src/components/Navigation.tsx:10`,
`src/components/ThemeToggle.tsx:5`, `src/components/ImageLightbox.tsx:50`).

## Target

Fix it once in CSS so all three call sites are covered and any future
`.btn-embossed` button inherits the ring. Follow the canonical `no-outline-none`
recipe — `:focus-visible` (keyboard only), a visible indicator, and an offset —
using the `box-shadow` variant the recipe allows for custom rings, because
`.btn-embossed` already owns `box-shadow` for its emboss effect:

    /* target — add immediately after the .btn-embossed:active block (src/index.css:247) */
      .btn-embossed:focus-visible {
        outline: 2px solid var(--color-foreground);
        outline-offset: 2px;
      }

Add nothing else. `outline` does not disturb the emboss `box-shadow`, follows the
element's `border-radius` in every current browser, and `--color-foreground` is
already the ring colour every other control in the app uses
(`focus-visible:ring-foreground`), so it inherits the correct value in both
themes automatically.

The `focus:outline-none` on the three elements can stay: `:focus-visible` has
higher specificity than the Tailwind `focus:` utility here because it is a
later-declared rule in the same `@layer`. **Verify this in the browser** (see the
behavior check) — if the outline does not appear, remove `focus:outline-none`
from the three call sites instead of raising specificity with `!important`.

## Repo conventions to follow

- `src/index.css` uses Tailwind v4 `@layer` blocks with two-space indentation and
  bare class selectors. Put the new rule in the same layer as `.btn-embossed`.
- Colours come from the CSS custom properties defined at the top of the file;
  never hardcode a hex value in a focus rule — the app has light and dark themes.
- The `.dark .btn-embossed` variants at `src/index.css:249-263` override
  background only. `--color-foreground` already flips with the theme, so no
  `.dark` variant of the focus rule is needed.

## Steps

1. In `src/index.css`, add the `.btn-embossed:focus-visible` rule directly after
   the `.btn-embossed:active` block that ends at line 247.
2. Load the app and confirm the ring appears on all three buttons (see below).
3. Only if the ring does not appear: remove `focus:outline-none` from
   `src/components/CheckoutDialog.tsx:312`,
   `src/components/AboutSection.tsx:53`, and
   `src/pages/UiKitThankYou.tsx:55`. Change nothing else on those lines.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the emboss `background`, `box-shadow`, `border`, or `transition`
  on `.btn-embossed` or any of its state variants.
- Do NOT add a global `*:focus-visible` rule — this plan is scoped to `.btn-embossed`.
- Do NOT touch `focus:outline-none` anywhere else in the codebase; every other
  occurrence is already paired with a `focus-visible:ring-*` replacement.
- Do NOT use `!important`.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress.
  - `bun run lint` (`tsc --noEmit`) passes (CSS-only change, but run it).
- **Behavior check (keyboard, not optional)**: for each of the three buttons —
  1. `/ui` → open the checkout dialog → Tab to "Continue to payment".
  2. `/` → Tab down to the `AboutSection` CTA.
  3. `/ui/thank-you` → Tab to the CTA.
  In each case a clearly visible ring must appear, in **both light and dark
  theme** (toggle with the nav control). Then **click** each button with the
  mouse and confirm no ring appears — `:focus-visible` must not fire for pointer
  input, or the design regresses.
- **Contrast**: with DevTools, check the ring colour against the button's dark
  gradient and against the surrounding surface. It must be discernible in both
  themes; if `--color-foreground` is too low-contrast against the dark button in
  one theme, keep the outline and add `outline-offset: 3px` so it sits on the
  page background rather than the button.
- **Done when**: all three buttons show a keyboard-only focus ring in both themes,
  no ring appears on mouse click, the score is not lower, and typecheck passes.
