# 003 — Stop ~365 always-on ambient cell animations on the homepage

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Performance
- **Rule**: Beyond the scan
- **Estimated scope**: 1-2 files, small

## Problem

`src/components/GitHubContributions.tsx:56` mounts the grid with
`ambientEffect="twinkle"`:

    // src/components/GitHubContributions.tsx:49 — current
            <GithubGraph
              account={contributions.username}
              data={data}
              months={12}
              showAccount={false}
              showLegend
              animation="wave"
              ambientEffect="twinkle"
              cellSize={14}
              cellGap={3}
              className="mx-auto"
            />

`getAmbientCellMotion` returns a keyframed opacity + scale animation for every
non-reduced-motion cell, and the transition repeats forever:

    // src/components/unlumen-ui/github-graph.tsx:193 — current
      return {
        animate: {
          opacity: isDrift ? [1, lowOpacity, 1 - 0.06 * strength, 1] : [1, lowOpacity, 1],
          scale: isDrift ? [1, smallScale, 1 + 0.025 * strength, 1] : [1, smallScale, 1],
        },

With `months={12}` that is roughly **365 independent, infinitely repeating Motion
animations** running for as long as the homepage is open — whether or not the
section is on screen. `prefers-reduced-motion` users are correctly exempted at
`src/components/unlumen-ui/github-graph.tsx:175`; everyone else pays continuously.

**User impact**: sustained main-thread and compositor work on every public
session, on the site's highest-traffic route, with no idle state. On a mid-range
phone this is a battery and scroll-smoothness cost that never stops.

## Target

This is a product decision as much as a performance one, so the plan gives the
executor a decision rule rather than a single answer. **Implement option A
unless the repository owner has said otherwise in the PR.**

**Option A (default — recommended): only animate while the grid is on screen.**
Keep the effect, gate it on visibility. Add an `IntersectionObserver` in
`GithubGraph` and pass `'none'` down while off screen:

    // target — inside GithubGraph, near the other hooks
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [onScreen, setOnScreen] = React.useState(false);

    React.useEffect(() => {
      const node = gridRef.current;
      if (!node || typeof IntersectionObserver === 'undefined') {
        setOnScreen(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => setOnScreen(entry?.isIntersecting ?? false),
        { rootMargin: '200px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    const activeAmbientEffect = onScreen ? ambientEffect : 'none';

Attach `ref={gridRef}` to the outermost `div` returned by `GithubGraph`
(currently `src/components/unlumen-ui/github-graph.tsx:355`), and pass
`activeAmbientEffect` wherever `ambientEffect` is currently passed to
`getAmbientCellMotion` (or to `<ContributionCell>` if plan 001 has landed).

**Option B (simpler, if the owner is happy to drop the effect): turn it off at
the call site.** One line — change `ambientEffect="twinkle"` to
`ambientEffect="none"` in `src/components/GitHubContributions.tsx:56`. The
`'none'` branch at `src/components/unlumen-ui/github-graph.tsx:175` already
returns a non-repeating settle animation, so the entrance still works and nothing
else changes.

If you implement Option A, do **not** also change the call site.

## Repo conventions to follow

- `import * as React` namespace style in `github-graph.tsx` (`React.useRef`,
  `React.useState`, `React.useEffect`). Do not switch to named imports in this file.
- `src/components/BodyOverlayScrollbars.tsx` is the in-repo exemplar for a DOM
  observer inside an effect with a cleanup that disconnects.
- Guard browser-only APIs (this file already guards `window` usage at
  `src/components/unlumen-ui/github-graph.tsx:340`).

## Steps

1. Decide A or B per the rule above; state which in the PR description.
2. **Option A**: add the ref, the `onScreen` state, the observer effect, and
   `activeAmbientEffect`; attach the ref to the outer `div`; swap the value
   passed into the ambient-motion call. Do not touch `GitHubContributions.tsx`.
3. **Option B**: change the single prop at `src/components/GitHubContributions.tsx:56`.
   Do not touch `github-graph.tsx`.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change `getAmbientCellMotion`'s maths, keyframes, or its
  `reducedMotion` early-return at `src/components/unlumen-ui/github-graph.tsx:175`.
- Do NOT change the entrance animation (`getCellDelay`, `animation="wave"`) —
  that is the one-shot reveal and it should stay.
- Do NOT change the tooltip (plan 002) or cell focusability (plan 004).
- Do NOT add dependencies (`IntersectionObserver` is a browser global).
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics, score does
    not regress. (This finding is beyond the scan, so no diagnostic clears.)
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check**: Load `/` and scroll to the GitHub section. The entrance
  wave must still play once. Option A: cells still twinkle while the section is
  visible, and the entrance is not re-triggered when you scroll away and back.
  Option B: cells settle in and hold steady. In both cases the hover wave and
  tooltip must still work, and macOS System Settings → Accessibility → Reduce
  motion must still fully disable cell animation.
- **Profiler (not optional)**: Open DevTools → Performance and record ~5 seconds
  with the page **idle and scrolled away from** the GitHub section. Before this
  change the timeline shows continuous animation frames; after, it should be
  essentially idle.
- **Done when**: the score is not lower, typecheck passes, the entrance and hover
  behaviour are unchanged, and an idle Performance recording away from the
  section shows no ongoing animation work.
