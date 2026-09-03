# 002 — Animate the contribution tooltip with transforms instead of left/top

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: MEDIUM
- **Category**: Performance
- **Rule**: react-doctor/no-layout-property-animation (4 × ERROR)
- **Estimated scope**: 1 file, ~25 lines

## Problem

The hover tooltip springs the layout properties `left` and `top`. React Doctor
reports this four times, at `src/components/unlumen-ui/github-graph.tsx:446`,
`:447`, `:454` and `:455` — the only four `error`-severity diagnostics in the
repo.

    // src/components/unlumen-ui/github-graph.tsx:439 — current
                  <m.span
                    role="tooltip"
                    className="pointer-events-none fixed z-50 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-card ring-1 ring-foreground/15"
                    initial={{
                      opacity: 0,
                      scale: 0.92,
                      left: hoveredContribution.originLeft,
                      top: hoveredContribution.originTop,
                      x: '-50%',
                      y: hoveredContribution.placement === 'above' ? '-100%' : '0%',
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      left: hoveredContribution.left,
                      top: hoveredContribution.top,
                      x: '-50%',
                      y: hoveredContribution.placement === 'above' ? '-100%' : '0%',
                    }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{
                      opacity: { duration: 0.12 },
                      scale: { duration: 0.12 },
                      left: { type: 'spring', stiffness: 620, damping: 42 },
                      top: { type: 'spring', stiffness: 620, damping: 42 },
                      y: { duration: 0.12 },
                    }}
                  >

`left` and `top` are layout properties: the browser redoes layout on every frame
of a stiffness-620 spring. This runs on every cell-to-cell hover across the grid,
on the homepage.

Note the element already uses the transform properties `x` and `y` for centering
and placement, so the two systems are fighting for the same job.

## Target

Per the canonical `no-layout-property-animation` recipe: *"For visual-only
movement … establish the final geometry and animate translate/scale (with the
correct transform origin) and opacity; transform and opacity are broadly
compositor-eligible."*

Pin the element at the viewport origin with static `left: 0; top: 0` and carry
**all** movement in `x`/`y`, folding the existing percentage centering into the
same transform with `calc()`. Motion animates `x`/`y` as `transform: translate()`,
which is compositor-eligible.

    // target
                  <m.span
                    role="tooltip"
                    className="pointer-events-none fixed left-0 top-0 z-50 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-card ring-1 ring-foreground/15"
                    initial={{
                      opacity: 0,
                      scale: 0.92,
                      x: `calc(${hoveredContribution.originLeft}px - 50%)`,
                      y:
                        hoveredContribution.placement === 'above'
                          ? `calc(${hoveredContribution.originTop}px - 100%)`
                          : `${hoveredContribution.originTop}px`,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: `calc(${hoveredContribution.left}px - 50%)`,
                      y:
                        hoveredContribution.placement === 'above'
                          ? `calc(${hoveredContribution.top}px - 100%)`
                          : `${hoveredContribution.top}px`,
                    }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{
                      opacity: { duration: 0.12 },
                      scale: { duration: 0.12 },
                      x: { type: 'spring', stiffness: 620, damping: 42 },
                      y: { type: 'spring', stiffness: 620, damping: 42 },
                    }}
                  >

The spring settings move from `left`/`top` to `x`/`y` unchanged, so the motion
feels the same. `left-0 top-0` are added as Tailwind classes on the existing
`fixed` element. The separate `y: { duration: 0.12 }` entry is dropped because
`y` now carries the position spring.

**If `calc()` string interpolation does not animate smoothly in `motion` v12**,
fall back to numeric `x`/`y` and do the centering in CSS instead: keep
`x: hoveredContribution.left`, `y: <top or top - height>`, and add
`translate-x-[-50%]` plus (for the `above` case) `translate-y-[-100%]` as
Tailwind classes. Do not go back to animating `left`/`top`. Record which variant
you shipped in the PR description.

## Repo conventions to follow

- `m.*` short forms only — `LazyMotion` runs in `strict` mode
  (`src/components/LazyMotionProvider.tsx:12`).
- Positioning classes live in `className` (Tailwind), animated values live in
  `initial`/`animate`. Keep that split.
- The codebase's existing spring usage keeps `stiffness`/`damping` explicit
  rather than using named presets — preserve the literal numbers.

## Steps

1. In `src/components/unlumen-ui/github-graph.tsx`, add `left-0 top-0` to the
   `m.span` `className` at line 441.
2. Replace the `initial`, `animate` and `transition` objects with the target
   above. Remove `left` and `top` from all three.
3. Leave `exit`, `role="tooltip"`, and the `AnimatePresence` wrapper untouched.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change `showTooltip` or the geometry it computes
  (`src/components/unlumen-ui/github-graph.tsx:330-353`) — `left`, `top`,
  `originLeft`, `originTop` and `placement` keep their current meanings.
- Do NOT change the spring stiffness/damping or the 0.12s opacity/scale durations.
- Do NOT change the cells — plans 001, 003 and 004 own those.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — all four
    `no-layout-property-animation` errors at `:446,447,454,455` clear and the
    score does not regress.
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check**: On `/`, hover across the contribution grid. The tooltip
  must (a) appear centred horizontally over the cell, (b) sit above the cell
  except near the top of the viewport where it flips below, (c) glide between
  cells with the same springy feel as before, and (d) stay clamped ≥96px from
  both viewport edges. Check at a narrow width where the clamp is active, and
  with the page scrolled.
- **Profiler (not optional)**: Open DevTools → Performance, record a slow drag
  across one row of the grid. Before this change the frames contain repeated
  *Layout* work; after, the tooltip's movement should show as compositor
  work with no per-frame Layout attributable to it.
- **Done when**: the four errors are clear, the score is not lower, typecheck
  passes, the tooltip is positioned and animated identically by eye, and the
  Performance trace no longer shows per-frame layout for the tooltip.
