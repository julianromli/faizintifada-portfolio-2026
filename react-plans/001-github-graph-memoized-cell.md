# 001 — Stop the contribution grid re-rendering all 365 cells on hover

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Performance
- **Rule**: react-doctor/js-hoist-intl + Beyond the scan
- **Estimated scope**: 1 file, ~120 lines moved/changed

## Problem

`src/components/unlumen-ui/github-graph.tsx` renders one `m.button` per day. On
the homepage it is mounted with `months={12}` (`src/components/GitHubContributions.tsx:52`),
so the grid is roughly 365 cells.

Two costs compound inside the per-cell render loop.

**(a) A new `Intl.DateTimeFormat` per cell.** `formatContributionLabel` constructs
one every call, and it is called once per cell at `src/components/unlumen-ui/github-graph.tsx:379`:

    // src/components/unlumen-ui/github-graph.tsx:152 — current
    function formatContributionLabel(contribution: GithubContributionCell): string {
      const date = new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).format(dateFromISO(contribution.date) ?? new Date());
      const label = contribution.count === 1 ? 'contribution' : 'contributions';
      return `${contribution.count} ${label} · ${date}`;
    }

    // src/components/unlumen-ui/github-graph.tsx:379 — current (inside the cell loop)
                      const label = formatContributionLabel(contribution);

`Intl.DateTimeFormat` construction loads and allocates locale-data tables. ~365
of them are built on every render of `GithubGraph`.

**(b) Every hover re-renders all 365 cells.** `onMouseEnter` calls `showTooltip`,
which sets `hoveredContribution` state on the parent, so the whole loop re-runs.
Each iteration allocates two fresh objects and a new string:

    // src/components/unlumen-ui/github-graph.tsx:381 — current
                      const ambientMotion = getAmbientCellMotion(
                        ambientEffect,
                        ambientIntensity,
                        weekIndex,
                        dayIndex,
                        entranceDelay,
                        reducedMotion,
                      );
                      const distance = hoveredContribution
                        ? Math.hypot(weekIndex - hoveredContribution.weekIndex, dayIndex - hoveredContribution.dayIndex)
                        : Infinity;
                      const waveStrength = Math.max(0, 1 - distance / 3);
                      const filter = `brightness(${1 + waveStrength * 0.45}) saturate(${1 + waveStrength * 0.2})`;

`filter` is a new string for every cell on every hover, so Motion diffs and
re-animates 365 `filter` values even though only the ~28 cells within radius 3
actually change. Moving the pointer across the grid does this on every cell
boundary crossing.

**User impact**: hovering the GitHub section of the homepage — the heaviest
component on the highest-traffic public route — triggers 365 React renders plus
365 Motion value diffs per pointer move.

## Target

Two changes. Both are behaviour-preserving: the rendered output is identical.

**(a) Hoist the formatter to module scope.** This is the canonical
`js-hoist-intl` recipe (module-scope hoisting, since no parameter varies):

    // target — near the other module-scope helpers, above formatContributionLabel
    const CONTRIBUTION_DATE_FORMATTER = new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    });

    function formatContributionLabel(contribution: GithubContributionCell): string {
      const date = CONTRIBUTION_DATE_FORMATTER.format(dateFromISO(contribution.date) ?? new Date());
      const label = contribution.count === 1 ? 'contribution' : 'contributions';
      return `${contribution.count} ${label} · ${date}`;
    }

**(b) Extract a `React.memo` cell whose props are all primitives or stable
references,** so the ~330 cells outside the wave radius bail out of re-rendering.
Add this as a module-scope component in the same file, above `GithubGraph`:

    // target — new module-scope component
    interface ContributionCellProps {
      contribution: GithubContributionCell;
      weekIndex: number;
      dayIndex: number;
      color: string;
      cellSize: number;
      cellRadius: number;
      /** 0 when this cell is outside the hover wave; drives the brightness filter. */
      waveStrength: number;
      ambientEffect: GithubGraphAmbientEffect;
      ambientIntensity: number;
      entranceDelay: number;
      reducedMotion: boolean | null;
      onShowTooltip: (
        element: HTMLButtonElement,
        contribution: GithubContributionCell,
        weekIndex: number,
        dayIndex: number,
        pointer?: { clientX: number; clientY: number },
      ) => void;
      onHideTooltip: () => void;
    }

    const ContributionCell = React.memo(function ContributionCell({
      contribution,
      weekIndex,
      dayIndex,
      color,
      cellSize,
      cellRadius,
      waveStrength,
      ambientEffect,
      ambientIntensity,
      entranceDelay,
      reducedMotion,
      onShowTooltip,
      onHideTooltip,
    }: ContributionCellProps) {
      const label = formatContributionLabel(contribution);
      const ambientMotion = React.useMemo(
        () =>
          getAmbientCellMotion(
            ambientEffect,
            ambientIntensity,
            weekIndex,
            dayIndex,
            entranceDelay,
            reducedMotion,
          ),
        [ambientEffect, ambientIntensity, weekIndex, dayIndex, entranceDelay, reducedMotion],
      );
      const filter = `brightness(${1 + waveStrength * 0.45}) saturate(${1 + waveStrength * 0.2})`;

      return (
        <m.button
          type="button"
          role="gridcell"
          aria-label={label}
          className="relative outline-none ring-offset-2 ring-offset-card transition-shadow focus-visible:ring-2 focus-visible:ring-foreground/60"
          style={{ width: cellSize, height: cellSize, borderRadius: cellRadius }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.35, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0, filter }}
          transition={{
            opacity: { duration: 0.14, delay: entranceDelay },
            y: { type: 'spring', stiffness: 520, damping: 28, delay: entranceDelay },
            scale: { type: 'spring', stiffness: 900, damping: 32 },
            filter: { duration: 0.08, ease: 'easeOut' },
          }}
          onMouseEnter={(event) =>
            onShowTooltip(event.currentTarget, contribution, weekIndex, dayIndex, event)
          }
          onFocus={(event) => onShowTooltip(event.currentTarget, contribution, weekIndex, dayIndex)}
          onBlur={onHideTooltip}
        >
          <m.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: color, borderRadius: cellRadius }}
            animate={ambientMotion.animate}
            transition={ambientMotion.transition}
          />
        </m.button>
      );
    });

And the call site inside the week loop becomes:

    // target — replaces the whole inline cell body at src/components/unlumen-ui/github-graph.tsx:377-436
                  {week.map((contribution, dayIndex) => {
                    const entranceDelay = reducedMotion
                      ? 0
                      : getCellDelay(animation, weekIndex, dayIndex, animationSpeed);
                    const distance = hoveredContribution
                      ? Math.hypot(
                          weekIndex - hoveredContribution.weekIndex,
                          dayIndex - hoveredContribution.dayIndex,
                        )
                      : Infinity;
                    return (
                      <ContributionCell
                        key={`${animationKey}-${contribution.date}`}
                        contribution={contribution}
                        weekIndex={weekIndex}
                        dayIndex={dayIndex}
                        color={colors[contribution.level]}
                        cellSize={cellSize}
                        cellRadius={resolvedCellRadius}
                        waveStrength={Math.max(0, 1 - distance / 3)}
                        ambientEffect={ambientEffect}
                        ambientIntensity={ambientIntensity}
                        entranceDelay={entranceDelay}
                        reducedMotion={reducedMotion}
                        onShowTooltip={showTooltip}
                        onHideTooltip={hideTooltip}
                      />
                    );
                  })}

`showTooltip` is already `React.useCallback(..., [])` at
`src/components/unlumen-ui/github-graph.tsx:330`, so it is stable. `onBlur`
currently passes an inline arrow — you must add a stable `hideTooltip` next to
`showTooltip` or `memo` will never bail out:

    // target — add beside showTooltip
    const hideTooltip = React.useCallback(() => setHoveredContribution(null), []);

Leave the `onMouseLeave={() => setHoveredContribution(null)}` on the grid
container at `src/components/unlumen-ui/github-graph.tsx:375` as it is — it is on
the parent, not a memoized child, so its inline arrow costs nothing. (Using
`hideTooltip` there too is fine and slightly tidier.)

## Repo conventions to follow

- This file uses the `import * as React` namespace style (`React.useMemo`,
  `React.useCallback`, `React.memo`). Every other file in `src/components/` uses
  named imports. **Match this file, not the others.**
- Motion components are the `m.*` short forms (never `motion.*`) because
  `src/components/LazyMotionProvider.tsx` runs `LazyMotion` in `strict` mode.
  Using `motion.button` will throw at runtime.
- `src/components/HeroImage.tsx:1` is the in-repo exemplar for a `memo`'d
  presentational component (`import { memo } ...`, wrapped at export).
- Keep the existing prop names, the `animationKey`-prefixed `key`, and the two
  ARIA attributes (`role="gridcell"`, `aria-label`) exactly as they are.

## Steps

1. In `src/components/unlumen-ui/github-graph.tsx`, add
   `CONTRIBUTION_DATE_FORMATTER` at module scope directly above
   `formatContributionLabel` (currently line 152) and change the function body to
   use it. Do not change the function's signature or output string.
2. Add the `ContributionCellProps` interface and the `ContributionCell`
   `React.memo` component at module scope, above `export function GithubGraph`
   (currently line 243). Move the JSX verbatim from the current inline cell.
3. Add `const hideTooltip = React.useCallback(() => setHoveredContribution(null), []);`
   immediately after the `showTooltip` `useCallback` block ends (currently line 353).
4. Replace the inline cell body inside `week.map(...)` with the
   `<ContributionCell ... />` call shown above.
5. Re-read the diff. The rendered DOM and every animation value must be
   unchanged — this plan moves code, it does not restyle anything.

## Boundaries

- Do NOT change `GithubGraph`'s public props, defaults, or the `GitHubContributions.tsx` call site.
- Do NOT change any animation value, easing, duration, delay, or the `filter` formula.
- Do NOT touch the tooltip `AnimatePresence` block (lines 438-470) — that is plan 002.
- Do NOT change `ambientEffect` defaults or `getAmbientCellMotion` — that is plan 003.
- Do NOT change the cells' focusability or tab order — that is plan 004.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — `js-hoist-intl` at
    `github-graph.tsx:153` is gone and the score does not regress.
  - `bun install` then `bun run lint` (`tsc --noEmit`) passes. Note: `node_modules`
    is not installed in a fresh clone, so install first.
- **Behavior check**: Load `/`, scroll to "GitHub Contributions". Hover across a
  row of cells — the brightness wave must still follow the pointer with the same
  ~3-cell falloff, and the tooltip must still appear and track. Tab into the grid
  and confirm the focus ring and tooltip-on-focus still work.
- **Profiler (not optional)**: In React DevTools, enable **Highlight updates**,
  then move the pointer across the grid. Before this change every cell flashes;
  after it only the cells near the pointer (and near the previous pointer
  position) should flash. Then record a Profiler trace of a single hover and
  confirm the committed render count for `GithubGraph`'s subtree drops from ~365
  cells to a few dozen.
- **Done when**: `js-hoist-intl` is clear, the score is not lower, typecheck
  passes, the wave and tooltip look identical, and Highlight updates shows only a
  local flash instead of a full-grid flash.
