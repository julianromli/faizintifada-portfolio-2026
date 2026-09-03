# 012 — Make the ThemeProvider state updater pure

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~6 lines

## Problem

`toggleTheme` passes a side-effecting function as a React state updater:

    // src/components/ThemeProvider.tsx:21 — current
      const toggleTheme = useCallback(() => {
        setThemeState((current) => flipTheme(current));
      }, []);

`flipTheme` is `toggleTheme` from `src/lib/theme.ts`, and it is not pure — it
writes `localStorage` and mutates `<html>`:

    // src/lib/theme.ts:21 — current
    export function setTheme(theme: Theme): void {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyTheme(theme);
    }

    export function toggleTheme(current: Theme): Theme {
      const next: Theme = current === 'light' ? 'dark' : 'light';
      setTheme(next);
      return next;
    }

React state updaters must be pure, because React may call them more than once for
a single update — it does so in `StrictMode` (enabled at `src/main.tsx:14`) and
when rebasing a concurrent render. A render React discards still leaves the
`localStorage` write and the `<html>` class change behind.

The DOM work is also redundant: the effect nine lines above already applies the
theme whenever it changes.

    // src/components/ThemeProvider.tsx:12 — current (already correct)
      useEffect(() => {
        applyTheme(theme);
      }, [theme]);

**User impact**: `ThemeProvider` wraps every session and `ThemeToggle` sits in the
nav on every page, so this is the app's most-exercised state update. The failure
mode is a persisted theme preference that does not match what was committed.

Note the sibling `setTheme` at `src/components/ThemeProvider.tsx:16` is already
correct — it performs its side effect *outside* the updater. That is the shape to
copy.

## Target

Make the updater a pure flip, and move persistence into the existing effect so
one write covers both `setTheme` and `toggleTheme`.

    // target — src/components/ThemeProvider.tsx:12
      useEffect(() => {
        persistTheme(theme);
      }, [theme]);

    // target — src/components/ThemeProvider.tsx:16
      const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
      }, []);

    // target — src/components/ThemeProvider.tsx:21
      const toggleTheme = useCallback(() => {
        setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
      }, []);

`persistTheme` is the existing alias for `setTheme` from `src/lib/theme.ts`,
already imported at `src/components/ThemeProvider.tsx:3`. Because
`setTheme` there calls `applyTheme` internally, this single effect both persists
and applies the theme — so the separate `applyTheme(theme)` call is no longer
needed, and `setTheme`'s own `persistTheme(next)` call becomes redundant.

After these edits `applyTheme` and `flipTheme` are unused in this file. Remove
them from the import at `src/components/ThemeProvider.tsx:3`, keeping
`getStoredTheme`, `persistTheme` and the `Theme` type.

Leave `src/lib/theme.ts` itself completely untouched.

**First paint is already handled** and this change does not affect it: the inline
script at `index.html:4-9` reads `localStorage.getItem('faiz-theme')` and sets the
`dark` class before React mounts. Confirm it still works (see the behavior check)
but do not modify it.

## Repo conventions to follow

- Named React imports; keep the existing `useCallback`/`useMemo`/`useEffect` usage.
- The `value` `useMemo` at `src/components/ThemeProvider.tsx:25` already stabilises
  the context object correctly — do not touch it.
- The import-aliasing style (`setTheme as persistTheme`) is established in this
  file; keep the surviving alias.

## Steps

1. In `src/components/ThemeProvider.tsx`, change the effect at line 12 to call
   `persistTheme(theme)` instead of `applyTheme(theme)`.
2. Simplify `setTheme` (line 16) to only call `setThemeState(next)`.
3. Replace the `toggleTheme` body with the pure inline flip.
4. Remove `applyTheme` and `flipTheme` from the import at line 3 — confirm each is
   genuinely unused in this file first.
5. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT edit `src/lib/theme.ts`.
- Do NOT edit `index.html` or its inline pre-paint theme script.
- Do NOT change the context shape, the `useMemo`, or `src/hooks/useTheme.ts`.
- Do NOT change `src/components/ThemeToggle.tsx`.
- Do NOT change the lazy initializer `useState(() => getStoredTheme())` at line 10.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress. (Beyond the scan, so nothing clears.)
  - `bun run lint` (`tsc --noEmit`) passes — this also catches any import you
    removed that was still in use.
- **Behavior check**:
  1. `bun run dev`, open `/`. Toggle the theme with the nav control several times
     rapidly. The page must switch every time, with no stuck or skipped state.
  2. Reload. The theme must persist. In DevTools → Application → Local Storage,
     confirm `faiz-theme` holds the expected value.
  3. Hard reload (Cmd+Shift+R) with dark stored. There must be no flash of light
     theme before paint — the inline script at `index.html:4` handles this and
     must still work.
  4. `StrictMode` is on in dev: confirm a single toggle produces a single final
     `localStorage` value, not one that lands a flip ahead or behind.
  5. Navigate between routes and confirm the theme holds.
- **Done when**: toggling and persistence work, there is no first-paint flash, the
  updater contains no side effect, the score is not lower, and typecheck passes.
