# 008 — Replace the render-phase ref write in Navigation with state

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-ref-current-in-render (ERROR)
- **Estimated scope**: 1 file, ~6 lines

## Problem

`Navigation` closes the mobile menu on route change by comparing the current
location against a ref it mutates **during render**:

    // src/components/Navigation.tsx:32 — current
      const location = useLocation();
      const locationKey = `${location.pathname}${location.hash}`;
      const prevLocationKeyRef = useRef(locationKey);
      const reduce = useReducedMotion();
      const menuMotion = reduce ? menuVariantsReduced : menuVariants;

      if (locationKey !== prevLocationKeyRef.current) {
        prevLocationKeyRef.current = locationKey;
        if (menuOpen) {
          setMenuOpen(false);
        }
      }

React Doctor reports this as an **error** at `src/components/Navigation.tsx:39`:
*"This ref is mutated during render. React can replay or discard render work, so
the mutation can leak from UI that never commits."*

The failure is concrete. Render must be pure because React may discard a render
pass. A ref write survives a discarded render; the queued `setMenuOpen(false)`
does not. On the next render `locationKey === prevLocationKeyRef.current`, the
condition is false, and the menu never closes.

**User impact**: a stuck full-screen menu overlay on the mobile breakpoint after
navigating. Route components here are `lazy()`-loaded
(`src/App.tsx:9-21`), so suspended and restarted renders are a normal occurrence
in this app, not a theoretical concern.

## Target

The canonical `no-ref-current-in-render` recipe says to move ref writes into an
effect or an event handler. **Do not use an effect here** — an effect runs after
paint, so the user would see one frame of the new route with the menu still open.

The correct fix for this specific shape — tracking a previous value to adjust
state during render — is React's documented "adjusting state when a prop changes"
pattern: hold the previous value in **state**, not a ref. A state update is
discarded together with the render that queued it, so the two stay consistent.
This satisfies the rule (no ref is written during render) and keeps the current
flash-free behaviour.

    // target — src/components/Navigation.tsx:32-43
      const location = useLocation();
      const locationKey = `${location.pathname}${location.hash}`;
      const [prevLocationKey, setPrevLocationKey] = useState(locationKey);
      const reduce = useReducedMotion();
      const menuMotion = reduce ? menuVariantsReduced : menuVariants;

      if (locationKey !== prevLocationKey) {
        setPrevLocationKey(locationKey);
        if (menuOpen) {
          setMenuOpen(false);
        }
      }

`useRef` may become unused in this file — if so, drop it from the import at
`src/components/Navigation.tsx:1`. **If plan 007 has already landed it is still
used** (`panelRef`, `triggerRef`); check before editing the import.

## Repo conventions to follow

- Named React imports; this file already uses them.
- Keep the `locationKey` derivation (`pathname` + `hash`) exactly as it is — the
  hash matters because `src/constants.ts` `NAV_LINKS` includes in-page anchors.
- Preserve the `if (menuOpen)` guard: setting state unconditionally would queue a
  no-op update on every navigation.

## Steps

1. In `src/components/Navigation.tsx`, replace the `prevLocationKeyRef` `useRef`
   with the `prevLocationKey` / `setPrevLocationKey` `useState` pair.
2. Update the render-phase comparison block to read and write state.
3. Check whether `useRef` is still used in the file; remove it from the import
   only if it is not.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT move this logic into a `useEffect` — that reintroduces a visible frame
  with the menu open on the new route.
- Do NOT change the body-overflow effect, the motion variants, or any JSX.
- Do NOT change the focus/Escape behaviour — that is plan 007, which should land
  **before** this plan.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — the `no-ref-current-in-render`
    error at `src/components/Navigation.tsx:39` clears and the score does not regress.
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check**: at a viewport below `md` (< 768px), on `/`:
  1. Open the mobile menu, tap a link to a different route. The menu must close
     and the new route must render — with no frame in which both are visible.
  2. Open the menu and tap a link to the **current** route. The menu must still
     close (the per-link `onClick` handles this).
  3. Open the menu and tap a hash link (e.g. `/#speaking`) from a different route
     and from the same route; the menu must close both times.
  4. Use the browser Back button with the menu open — the menu must close.
  5. At desktop width, confirm nothing changed.
- **Profiler**: with React DevTools "Highlight updates" on, navigate between
  routes and confirm `Navigation` does not enter a render loop (a repeated,
  continuous flash would mean the guard was dropped).
- **Done when**: the error is clear, the score is not lower, typecheck passes, and
  all five navigation cases close the menu with no flash.
