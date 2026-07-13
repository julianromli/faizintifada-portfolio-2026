# 002 — Add a celebratory entrance to the purchase success icon

- **Status**: DONE
- **Commit**: cc1e080
- **Severity**: LOW
- **Category**: Missed opportunity (delight)
- **Estimated scope**: 1 file (`src/pages/UiKitThankYou.tsx`), ~15 lines.

## Problem

`/ui/thank-you` is the screen a user lands on immediately after paying for the UI
kit — the single highest-emotion, rarest, first-time moment in the entire app.
Per the frequency model, rare/first-time moments are exactly where delight is
warranted. Today the success checkmark renders completely static:

```tsx
/* src/pages/UiKitThankYou.tsx:11 — current */
<CheckCircle size={56} weight="fill" className="text-emerald-500" aria-hidden />
```

The heading and body below it are also static. A subtle, physics-based entrance
on the checkmark (with a light stagger into the text) would acknowledge the
moment without being gaudy — and it costs almost nothing because the page is seen
once per purchase.

## Target

Animate the checkmark in with an Apple-style spring, and let the heading + body
fade up just after it. Use Motion's `m` components (the app already wraps
everything in `LazyMotion` with `domAnimation`, so `m.*` is required, not
`motion.*`). Respect reduced motion by collapsing to an opacity-only fade.

Spring config (from AUDIT.md, Apple-style, subtle bounce):

```ts
{ type: 'spring', duration: 0.5, bounce: 0.2 }
```

Target structure:

```tsx
// target — imports
import { Link } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import { m, useReducedMotion } from 'motion/react';
import { Seo } from '../components/Seo';
import { UI_KIT } from '../constants';
import { EASE_OUT } from '../lib/motion'; // if plan 001 is done; otherwise inline [0.23, 1, 0.32, 1] as const

export function UiKitThankYou() {
  const reduce = useReducedMotion();

  const iconAnim = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, ease: EASE_OUT } }
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: 'spring', duration: 0.5, bounce: 0.2 },
      };

  const textAnim = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, ease: EASE_OUT } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: EASE_OUT, delay },
        };

  return (
    <>
      <Seo title="Thank you" path="/ui/thank-you" noIndex />
      <main className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <m.div {...iconAnim} className="inline-flex">
          <CheckCircle size={56} weight="fill" className="text-emerald-500" aria-hidden />
        </m.div>
        <m.h1
          {...textAnim(0.08)}
          className="mt-6 max-w-xl text-[2rem] sm:text-[2.5rem] leading-tight font-semibold tracking-tight text-foreground"
        >
          Payment received — welcome to {UI_KIT.name}.
        </m.h1>
        <m.p
          {...textAnim(0.14)}
          className="mt-4 max-w-md text-[16px] leading-relaxed text-muted"
        >
          Check your email for your access token, install command, and quick-start
          guideline. It can take a minute to arrive — also check spam.
        </m.p>
        {/* buttons block unchanged */}
      </main>
    </>
  );
}
```

Delays: 0.08s and 0.14s put the two text lines in a gentle 60ms stagger (within
the 30–80ms window from AUDIT.md) starting right as the icon spring settles.
Keep the existing button block exactly as-is.

## Repo conventions to follow

- Use `m.*`, never `motion.*` — the app runs `LazyMotion features={domAnimation}
  strict` in `src/components/LazyMotionProvider.tsx`, and `strict` throws on
  `motion.*`.
- Reduced-motion is handled per-component with `useReducedMotion()` and a branched
  value — see `src/components/Hero.tsx:26` (`testimonialVariants`) and every
  dialog. Follow that pattern, not a separate CSS media query.
- The strong ease-out for non-spring parts is `[0.23, 1, 0.32, 1]`. If plan 001
  (`src/lib/motion.ts`) has landed, import `EASE_OUT` from `../lib/motion`;
  otherwise declare `const EASE_OUT = [0.23, 1, 0.32, 1] as const;` locally at the
  top of the file.
- Apple-style spring form `{ type: 'spring', duration: 0.5, bounce: 0.2 }` is the
  AUDIT.md recommendation; ToolsStack uses the older stiffness/damping form —
  prefer the duration/bounce form here for readability.

## Steps

1. Add imports: `m` and `useReducedMotion` from `motion/react`, and `EASE_OUT`
   (from `../lib/motion` if present, else a local const).
2. Add the `reduce = useReducedMotion()` line and the `iconAnim` / `textAnim`
   definitions shown above at the top of the component body.
3. Wrap the `CheckCircle` in an `m.div` with `{...iconAnim}` and
   `className="inline-flex"` (so layout/centering is unchanged — the div only
   wraps the icon, it does not add spacing).
4. Change the `<h1>` to `<m.h1 {...textAnim(0.08)} ...>` and the description
   `<p>` to `<m.p {...textAnim(0.14)} ...>`, keeping their existing `className`
   values verbatim.
5. Leave the `<div className="mt-9 ...">` button block and both links untouched.

## Boundaries

- Do NOT animate the two buttons — they're actionable, keep them instant.
- Do NOT change any `className`, copy text, `Seo` props, or layout structure
  beyond wrapping the icon in `m.div` and swapping `h1`/`p` to `m.h1`/`m.p`.
- Do NOT add a confetti library or any dependency. Motion is already installed.
- Keep the total entrance under ~0.6s; do not raise `bounce` above 0.3.
- If `UiKitThankYou.tsx` no longer matches the excerpt (drift since cc1e080),
  STOP and report.

## Verification

- **Mechanical**: `bun run lint` and `bun run build` both pass.
- **Feel check**: navigate to `/ui/thank-you` and confirm:
  - The checkmark pops in with a soft spring (a hint of overshoot, not a bounce
    party), then the heading and body fade up just behind it in a subtle stagger.
  - In DevTools Animations panel at 10% playback, the icon settles cleanly with no
    abrupt stop, and the text starts as the icon nears rest (no awkward gap).
  - Toggle `prefers-reduced-motion` (Rendering panel): the checkmark and text
    should simply fade in (no scale, no movement), never jump.
  - Reload a few times — the entrance should feel celebratory but not slow;
    if it drags, the icon is the knob (drop `duration` toward 0.4).
- **Done when**: build/typecheck pass, the entrance plays once on load with a
  subtle spring + staggered text, and reduced motion degrades to a plain fade.
