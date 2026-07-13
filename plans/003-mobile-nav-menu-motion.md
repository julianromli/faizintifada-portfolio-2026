# 003 — Animate the mobile navigation menu open/close

- **Status**: DONE
- **Commit**: cc1e080
- **Severity**: LOW
- **Category**: Interruptibility / cohesion
- **Estimated scope**: 1 file (`src/components/Navigation.tsx`), ~20 lines.

## Problem

The mobile nav menu is spatially anchored just below the hamburger button, but it
teleports in and out with no transition, while every dialog and reveal in the app
animates. On a crisp, otherwise-polished product this instant pop reads as a
cohesion gap and gives no sense of where the panel came from.

```tsx
/* src/components/Navigation.tsx:62-89 — current */
{menuOpen ? (
  <>
    <button
      type="button"
      className="fixed inset-0 z-40 bg-black/20 md:hidden"
      aria-label="Close menu"
      onClick={() => setMenuOpen(false)}
    />
    <div
      id="mobile-nav-menu"
      className="fixed top-6 right-4 left-4 z-50 md:hidden rounded-2xl border border-border bg-card p-6 shadow-lg theme-transition"
    >
      <div className="flex flex-col gap-1 text-[17px] text-muted">
        {NAV_LINKS.map(({ to, label }) => ( /* ... */ ))}
      </div>
    </div>
  </>
) : null}
```

Because the menu is toggled (can be opened/closed rapidly) and unmounts on close,
it needs an interruptible enter **and** an exit that plays before unmount —
otherwise an animated enter with an instant disappear feels worse than no motion.

## Target

Wrap the overlay + panel in `AnimatePresence` so both enter and exit animate. The
backdrop cross-fades; the panel drops in from just above its resting spot,
scaling up slightly from the top edge (it hangs off the top of the viewport near
the hamburger, so `transform-origin: top`). Reduced motion → opacity only.

Values (strong ease-out `[0.23, 1, 0.32, 1]`, dropdown-range durations 150–250ms
from AUDIT.md):

```tsx
// target — module scope (near the top of Navigation.tsx)
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { EASE_OUT } from '../lib/motion'; // if plan 001 done; else: const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } },
};

const menuVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15, ease: EASE_OUT } },
};

const menuVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};
```

```tsx
// target — render (inside the component)
const reduce = useReducedMotion();
const menuMotion = reduce ? menuVariantsReduced : menuVariants;
// backdrop can always animate opacity (safe under reduced motion)

<AnimatePresence>
  {menuOpen ? (
    <div key="mobile-nav" className="md:hidden">
      <m.button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      />
      <m.div
        id="mobile-nav-menu"
        className="fixed top-6 right-4 left-4 z-50 origin-top rounded-2xl border border-border bg-card p-6 shadow-lg theme-transition"
        variants={menuMotion}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex flex-col gap-1 text-[17px] text-muted">
          {NAV_LINKS.map(({ to, label }) => ( /* unchanged links */ ))}
        </div>
      </m.div>
    </div>
  ) : null}
</AnimatePresence>
```

Note the `origin-top` class added to the panel (Tailwind `transform-origin: top`)
so the slight scale grows from the top edge nearest the trigger, not the center.
The `md:hidden` moves to the wrapping `div` so it still only renders on mobile.

## Repo conventions to follow

- Use `m.*` (not `motion.*`) — `LazyMotion strict` is active
  (`src/components/LazyMotionProvider.tsx`).
- `AnimatePresence` + `hidden`/`visible`/`exit` variants + a `useReducedMotion()`
  branch is the established dialog pattern — mirror
  `src/components/ContactChoiceDialog.tsx` (variants at lines 14-40, render with
  `AnimatePresence mode="wait"` and `panelMotion`). Here we do NOT need
  `mode="wait"` since there's a single child.
- Reuse `EASE_OUT` from `src/lib/motion.ts` if plan 001 has landed; otherwise
  declare it locally.
- Keep `NAV_LINKS.map(...)` link markup and the existing `onClick`/`className`
  on each `Link` exactly as they are.

## Steps

1. Update the import line to pull `AnimatePresence, m, useReducedMotion` from
   `motion/react`, and import/declare `EASE_OUT`.
2. Add the three variant objects (`backdropVariants`, `menuVariants`,
   `menuVariantsReduced`) at module scope.
3. In the component body add `const reduce = useReducedMotion();` and
   `const menuMotion = reduce ? menuVariantsReduced : menuVariants;`.
4. Replace the `{menuOpen ? ( <> ... </> ) : null}` block with the
   `<AnimatePresence>` structure above: a single keyed wrapper `div.md:hidden`
   containing the `m.button` backdrop and the `m.div` panel. Add `origin-top` to
   the panel className and remove the now-redundant `md:hidden` from the backdrop
   and panel (it lives on the wrapper).
5. Confirm the `useEffect` that locks `document.body.style.overflow` still keys
   off `menuOpen` — leave it unchanged. (Body scroll unlocks the instant
   `menuOpen` flips false, which is fine; the panel's 150ms exit still plays.)

## Boundaries

- Do NOT change the hamburger button, the desktop nav, the `ThemeToggle`, or the
  `NAV_LINKS` link markup/handlers.
- Do NOT change close behavior or the route-change auto-close logic
  (`prevLocationKeyRef`) — only wrap the rendered menu in motion.
- Do NOT convert this to a native `<dialog>` or add a focus trap in this plan
  (out of scope; the menu closes on link click, backdrop click, and route
  change).
- Do NOT add dependencies.
- If the menu block no longer matches the excerpt (drift since cc1e080), STOP and
  report.

## Verification

- **Mechanical**: `bun run lint` and `bun run build` pass.
- **Feel check**: on a narrow viewport (or device toolbar), tap the hamburger and
  confirm:
  - The panel drops in slightly from above and scales up from its top edge (not
    from center), backdrop fading in with it; on close, both animate out before
    disappearing — no instant pop.
  - Rapidly tapping open/close does not leave the panel stuck or restart from a
    jump — `AnimatePresence` should let the exit interrupt cleanly.
  - Tapping a link still navigates and the menu animates closed on the route
    change.
  - Toggle `prefers-reduced-motion`: the panel should fade only (no drop/scale),
    backdrop still fades.
  - At 10% playback (Animations panel), confirm `transform-origin` is the top edge
    and opacity/transform stay in sync.
- **Done when**: build/typecheck pass, the menu animates in and out from the top,
  interruption is clean, and reduced motion degrades to fade-only.
