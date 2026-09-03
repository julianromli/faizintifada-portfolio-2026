# 004 — Give the contribution grid one tab stop instead of ~370

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Accessibility
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~60 lines

## Problem

Every day in the grid renders a natively focusable `<button>` with no `tabIndex`
management:

    // src/components/unlumen-ui/github-graph.tsx:395 — current
                    <m.button
                      key={`${animationKey}-${contribution.date}`}
                      type="button"
                      role="gridcell"
                      aria-label={label}
                      className="relative outline-none ring-offset-2 ring-offset-card transition-shadow focus-visible:ring-2 focus-visible:ring-foreground/60"

On the homepage the grid is mounted with `months={12}`
(`src/components/GitHubContributions.tsx:52`), so this is roughly **370
consecutive tab stops** in the middle of the page.

**User impact**: a keyboard-only user must press Tab ~370 times to get from the
"View GitHub" link to the `ToolsStack` section, the `AboutSection` CTA, and the
footer. In practice the GitHub section is a wall that ends keyboard traversal of
the homepage. The markup also *claims* a grid (`role="grid"` /
`role="row"` / `role="gridcell"`), and the ARIA grid pattern promises arrow-key
navigation that the code does not implement — so screen-reader users are told to
use arrows that do nothing.

There is no `tabIndex` anywhere in this file (verified: `grep -n "tabIndex"
src/components/unlumen-ui/github-graph.tsx` returns nothing).

## Target

Implement the standard **roving tabindex**: exactly one cell is tabbable at a
time, and Arrow / Home / End move focus within the grid.

Add focus-position state and a key handler to `GithubGraph`:

    // target — inside GithubGraph, near the other hooks
    const [focusedCell, setFocusedCell] = React.useState<{ weekIndex: number; dayIndex: number }>({
      weekIndex: 0,
      dayIndex: 0,
    });
    const gridRef = React.useRef<HTMLDivElement>(null);

    /** Moves DOM focus to a cell; the roving tabIndex follows focusedCell. */
    const focusCell = React.useCallback((weekIndex: number, dayIndex: number) => {
      setFocusedCell({ weekIndex, dayIndex });
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-cell="${weekIndex}-${dayIndex}"]`)
        ?.focus();
    }, []);

    const onGridKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        const { weekIndex, dayIndex } = focusedCell;
        const lastWeek = weeks.length - 1;
        if (lastWeek < 0) return;

        let nextWeek = weekIndex;
        let nextDay = dayIndex;

        switch (event.key) {
          case 'ArrowRight': nextWeek = Math.min(lastWeek, weekIndex + 1); break;
          case 'ArrowLeft':  nextWeek = Math.max(0, weekIndex - 1); break;
          case 'ArrowDown':  nextDay  = Math.min(6, dayIndex + 1); break;
          case 'ArrowUp':    nextDay  = Math.max(0, dayIndex - 1); break;
          case 'Home':       nextWeek = 0; break;
          case 'End':        nextWeek = lastWeek; break;
          default: return;
        }

        // Clamp to a week that actually has this day (the last week can be short).
        while (nextWeek >= 0 && !weeks[nextWeek]?.[nextDay]) nextWeek -= 1;
        if (nextWeek < 0) return;

        event.preventDefault();
        focusCell(nextWeek, nextDay);
      },
      [focusedCell, weeks, focusCell],
    );

Attach both to the element that already carries `role="grid"` (currently
`src/components/unlumen-ui/github-graph.tsx:369`):

    // target
              <div
                ref={gridRef}
                className="relative flex min-w-max"
                style={{ gap: cellGap }}
                role="grid"
                aria-label={`GitHub contributions for ${normalizedAccount ?? account}`}
                onKeyDown={onGridKeyDown}
                onMouseLeave={() => setHoveredContribution(null)}
              >

And give each cell a roving `tabIndex`, a `data-cell` hook, and a focus handler
that keeps `focusedCell` in sync when focus arrives by click or by Tab:

    // target — added to the cell button (alongside its existing props)
                      data-cell={`${weekIndex}-${dayIndex}`}
                      tabIndex={
                        focusedCell.weekIndex === weekIndex && focusedCell.dayIndex === dayIndex
                          ? 0
                          : -1
                      }

and extend the existing `onFocus` so it also records the position:

    // target — replaces the current onFocus on the cell
                      onFocus={(event) => {
                        setFocusedCell({ weekIndex, dayIndex });
                        showTooltip(event.currentTarget, contribution, weekIndex, dayIndex);
                      }}

**If plan 001 has already landed**, `ContributionCell` is a separate memoized
component: add `tabIndex`, `data-cell` and an `onFocusCell(weekIndex, dayIndex)`
callback prop to `ContributionCellProps`, pass `isTabbable: boolean` (not the
whole `focusedCell` object) so the memo comparison stays cheap, and derive
`tabIndex={isTabbable ? 0 : -1}` inside the cell.

Note the initial `focusedCell` of `{0, 0}` is safe: `buildContributionWeeks`
pads the first week from Sunday, so `weeks[0][0]` always exists when
`weeks.length > 0`.

## Repo conventions to follow

- `import * as React` namespace style in this file only.
- The codebase already uses `tabIndex={-1}` deliberately in four places
  (`src/components/Select.tsx:203` is the closest exemplar — a `role="listbox"`
  taken out of the tab order); there are no positive `tabIndex` values anywhere
  and this plan must not introduce one.
- Keep the existing `focus-visible:ring-2 focus-visible:ring-foreground/60` on
  the cell — the focus indicator is already correct and must survive.

## Steps

1. Add `focusedCell` state, `gridRef`, `focusCell` and `onGridKeyDown` to
   `GithubGraph`.
2. Attach `ref`, `onKeyDown` to the `role="grid"` container at line 369.
3. Add `data-cell` and the roving `tabIndex` to the cell button; extend its
   `onFocus` to set `focusedCell`.
4. Manually walk the keyboard model listed in the behavior check below.
5. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT remove the per-cell `aria-label` — it is the only non-visual access to
  the contribution data.
- Do NOT change `role="grid"` / `role="row"` / `role="gridcell"`; the roving
  tabindex is exactly what those roles already promise.
- Do NOT change the mouse hover behaviour or the tooltip geometry.
- Do NOT change the legend, the cells' visual style, or any animation.
- Do NOT add a keyboard library or any other dependency.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics, score does
    not regress. (Beyond the scan, so no diagnostic clears.)
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check (keyboard, not optional)**: On `/`, Tab from the "View GitHub"
  link. Confirm:
  1. Exactly **one** Tab press enters the grid, and exactly **one** more leaves it
     and lands on the next control after the section.
  2. Inside the grid, Left/Right move by week, Up/Down move by day, Home/End jump
     to the first/last week, and focus never escapes the grid via arrows.
  3. The focus ring is visible on the focused cell and the tooltip appears on
     focus, as it does today.
  4. Shift+Tab from below the section re-enters at the last-focused cell.
  5. Clicking a cell with the mouse, then pressing Tab, leaves the grid (it does
     not restart the walk).
- **Screen reader**: with VoiceOver (Cmd+F5) navigate into the grid and confirm
  each focused cell announces its `aria-label` (e.g. "3 contributions · Mar 4").
- **Done when**: the grid is one tab stop, arrows navigate it, the score is not
  lower, typecheck passes, and the hover/tooltip behaviour is unchanged.
