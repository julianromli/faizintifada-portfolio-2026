# 001 — Consolidate the shared easing curve and dialog panel variants

- **Status**: DONE
- **Commit**: cc1e080
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 new file + edits to ~14 files (index.css, 4 dialogs, and the components/pages that inline the easing array). Pure refactor — zero intended visual change.

## Problem

The codebase uses exactly one easing curve everywhere — a strong ease-out,
`cubic-bezier(0.23, 1, 0.32, 1)` — but it is hand-typed 30+ times in two forms:

- As a CSS string in `src/index.css` (5 occurrences), e.g.:

  ```css
  /* src/index.css:13 — current */
  --animate-fade-in: fade-in 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  ```

  ```css
  /* src/index.css:118 — current */
  .animate-blur-reveal {
    opacity: 0;
    animation: blur-reveal 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }
  ```

  ```css
  /* src/index.css:194 — current (inside .btn-embossed) */
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms cubic-bezier(0.23, 1, 0.32, 1);
  ```

- As a Framer Motion array literal `[0.23, 1, 0.32, 1] as const` in 12 `.tsx`
  files (AboutSection, CheckoutDialog, CoachingFormDialog, ContactChoiceDialog,
  Hero ×2, LatestVideos, ProjectCard, SpeakingGallery, TestimonialFormDialog,
  ToolsStack ×2, ProjectDetail ×3, UiKit ×2), each usually via a local
  `const EASE_OUT = [0.23, 1, 0.32, 1] as const;`.

Separately, four dialogs each declare an **identical** pair of panel variants
(`panelVariants` + `panelVariantsReduced`) by copy-paste:
`src/components/CheckoutDialog.tsx:10-20`, `src/components/ContactChoiceDialog.tsx:14-40`,
`src/components/CoachingFormDialog.tsx:27-37`, `src/components/TestimonialFormDialog.tsx:19-29`.
The canonical shape (from `CheckoutDialog.tsx:10-20`) is:

```ts
// current — duplicated across 4 dialogs
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.16, ease: EASE_OUT } },
};

const panelVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};
```

Why it matters: tuning the site's motion feel means editing a dozen files, and
the four variant copies will inevitably drift (they already differ only in
whitespace). One source of truth removes that risk. This is maintainability, not
feel — the rendered output must be byte-for-byte equivalent.

## Target

A single easing token in CSS and a single shared motion module in TS.

CSS — add one `@theme` token and reference it (Tailwind v4 `@theme` block already
exists at `src/index.css:10`):

```css
/* target — add inside the existing @theme { ... } block */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

```css
/* target — index.css usages reference the token */
--animate-fade-in: fade-in 0.4s var(--ease-out) forwards;

.animate-blur-reveal {
  opacity: 0;
  animation: blur-reveal 0.6s var(--ease-out) forwards;
}

/* .btn-embossed */
transition: transform 160ms var(--ease-out), box-shadow 160ms var(--ease-out), background 160ms var(--ease-out);
```

TS — one new module `src/lib/motion.ts`:

```ts
// target — src/lib/motion.ts
import type { Variants } from 'motion/react';

/** Strong ease-out for UI motion. Mirrors the CSS --ease-out token. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Shared modal/dialog panel entrance + exit. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.16, ease: EASE_OUT } },
};

/** Reduced-motion counterpart: opacity only, no movement/scale. */
export const panelVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};
```

Every `.tsx` that currently declares a local `EASE_OUT` or inlines
`[0.23, 1, 0.32, 1] as const` imports `EASE_OUT` from `../lib/motion`
(or `../../lib/motion` from `src/pages/*`). Each of the four dialogs imports
`panelVariants` and `panelVariantsReduced` from that module and deletes its local
copies.

## Repo conventions to follow

- Shared helpers live in `src/lib/*.ts` (e.g. `src/lib/api.ts`,
  `src/lib/checkout-api.ts`, `src/lib/theme.ts`). Put the new module at
  `src/lib/motion.ts`.
- Tailwind v4 design tokens live in the `@theme { ... }` block at the top of
  `src/index.css` (see the existing `--animate-fade-in` and `--font-sans` lines).
  Add `--ease-out` there.
- Motion values are already named `EASE_OUT` locally in the dialogs — keep that
  exact name for the exported const so imports read naturally.
- Import path depth: components under `src/components/` use `../lib/...`; pages
  under `src/pages/` use `../lib/...` as well (they're one level deep). Verify the
  relative path compiles rather than assuming.

## Steps

1. Create `src/lib/motion.ts` with the exact contents shown in **Target** (the
   `EASE_OUT` const and both variant objects).

2. In `src/index.css`, add `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` inside
   the existing `@theme { ... }` block (near `--animate-fade-in` at line 13).
   Then replace the 5 inline `cubic-bezier(0.23, 1, 0.32, 1)` occurrences
   (lines 13, 14 is `ease-in-out` — DO NOT touch that one, 118, and the three in
   the `.btn-embossed` transition at 194) with `var(--ease-out)`.
   **Only replace the exact string `cubic-bezier(0.23, 1, 0.32, 1)`.** Leave
   `cubic-bezier` values that are anything else (e.g. the `ease-in-out` skeleton
   shimmer uses `ease-in-out`, not this curve) untouched.

3. In each of the four dialog files, delete the local `EASE_OUT`,
   `panelVariants`, and `panelVariantsReduced` declarations and instead add:
   `import { EASE_OUT, panelVariants, panelVariantsReduced } from '../lib/motion';`
   - `src/components/CheckoutDialog.tsx` (local decls at lines 8, 10-20)
   - `src/components/ContactChoiceDialog.tsx` (lines 6, 14-40; keep its
     `iconContainerVariants`/`iconItemVariants` — those are local and stay)
   - `src/components/CoachingFormDialog.tsx` (lines 25, 27-37)
   - `src/components/TestimonialFormDialog.tsx` (lines 17, 19-29)
   Note: `ContactChoiceDialog` and `CheckoutDialog` also use `EASE_OUT` inline
   elsewhere (e.g. `ContactChoiceDialog.tsx:161`) — those references keep working
   via the import.

4. In the remaining `.tsx` files that declare a local
   `const EASE_OUT = [0.23, 1, 0.32, 1] as const;` OR inline the array in a
   `transition`/`ease` field, replace with an import of `EASE_OUT` from the motion
   module and use the imported const. Files: `AboutSection.tsx`, `Hero.tsx`,
   `LatestVideos.tsx`, `ProjectCard.tsx`, `SpeakingGallery.tsx`, `ToolsStack.tsx`,
   `ProjectDetail.tsx`, `UiKit.tsx`. For pages use `../lib/motion`; for components
   use `../lib/motion`. Where the array is inlined directly in JSX (e.g.
   `ease: [0.23, 1, 0.32, 1] as const`), replace the literal with `ease: EASE_OUT`.

5. Grep to confirm no stray copies remain:
   `rg -n "0\.23, 1, 0\.32, 1" src` should return only `src/lib/motion.ts` and
   `src/index.css` (the token definition). `rg -n "cubic-bezier\(0.23, 1, 0.32, 1\)" src`
   should return only the `--ease-out` definition line.

## Boundaries

- Do NOT change any duration, delay, scale, y-offset, or variant shape. Values
  must stay identical — this is a lift-and-reference refactor only.
- Do NOT touch `cubic-bezier(0.77, 0, 0.175, 1)` or any `ease-in-out`,
  `ease-out`, `ease`, or `linear` keyword usages — only the exact
  `cubic-bezier(0.23, 1, 0.32, 1)` string and the exact `[0.23, 1, 0.32, 1]`
  array.
- Do NOT touch `ContactChoiceDialog`'s `iconContainerVariants` /
  `iconItemVariants`, or any component-specific variants (e.g. Hero's
  `testimonialVariants`, AboutSection's `containerVariants`/`itemVariants`) —
  those are not shared and stay local. (You MAY switch their inlined `ease` array
  to the imported `EASE_OUT`, but leave their structure alone.)
- Do NOT add dependencies. `motion/react` already exports the `Variants` type.
- If a file's local declarations don't match the excerpts above (drift since
  commit cc1e080), STOP and report which file differs instead of guessing.

## Verification

- **Mechanical**:
  - `bun run lint` (runs `tsc --noEmit`) → passes with no errors.
  - `bun run build` → succeeds.
  - `rg -n "\[0.23, 1, 0.32, 1\]" src` → only `src/lib/motion.ts`.
  - `rg -n "cubic-bezier\(0.23, 1, 0.32, 1\)" src` → only the `--ease-out` token
    line in `src/index.css`.
- **Feel check**: this is a no-visual-change refactor, so the goal is to confirm
  nothing moved:
  - Open each dialog (Contact from the hero "Discuss a Project", Checkout from
    `/ui`, Coaching form, Testimonial form) and confirm the panel still eases in
    with the same subtle scale/rise and eases out on close — indistinguishable
    from before.
  - Scroll the home page and confirm ProjectCard / LatestVideos / ToolsStack /
    AboutSection reveals look unchanged.
  - Toggle `prefers-reduced-motion` (DevTools → Rendering) and confirm dialogs
    still fall back to opacity-only.
- **Done when**: build + typecheck pass, greps return only the single sources of
  truth, and every dialog/reveal looks identical to the pre-refactor build.
