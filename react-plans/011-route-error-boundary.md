# 011 — Add a route-level error boundary

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files (1 new), ~70 lines

## Problem

There is **no error boundary anywhere in the application** — verified:
`grep -rn "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" src server`
returns nothing.

Every public route is a dynamically imported chunk behind a single `Suspense`:

    // src/App.tsx:9 — current
    const Home = lazy(() => import('./pages/Home').then((mod) => ({ default: mod.Home })));
    const Projects = lazy(() => import('./pages/Projects').then((mod) => ({ default: mod.Projects })));
    // ... Coaching, Speaking, UiKit, UiKitThankYou, ProjectDetail, NotFound, AdminApp

    // src/App.tsx:52 — current
                <Suspense
                  fallback={<p className="py-12 text-[15px] text-muted animate-pulse">Loading…</p>}
                >
                  <Routes>
                    <Route path="/" element={<Home />} />

Without a boundary, any error thrown while rendering a route — including a
**rejected `lazy()` import** — unmounts the whole React tree and leaves a blank
white page.

**User impact**: a rejected chunk import is the single most common white-screen
in a deployed SPA. This site is deployed as a Vite build with content-hashed
chunk filenames (`vite.config.ts`, `vercel.json`), so a visitor with the page
open across a redeploy who then navigates will request a chunk URL that no longer
exists. Today that blanks the entire site, including `/ui` and `/ui/thank-you` —
the revenue path.

## Target

Add a small class error boundary (React has no hook equivalent) and place it
inside `PublicShell` so `Navigation` and `Footer` survive the failure and the
visitor can navigate away instead of staring at nothing.

New file:

    // target — src/components/RouteErrorBoundary.tsx
    import { Component, type ErrorInfo, type ReactNode } from 'react';

    interface RouteErrorBoundaryProps {
      children: ReactNode;
    }

    interface RouteErrorBoundaryState {
      hasError: boolean;
    }

    /**
     * Catches render errors in the lazily-loaded route subtree — most importantly a
     * rejected chunk import after a redeploy, which would otherwise blank the page.
     * Kept outside Navigation/Footer so the shell stays usable.
     */
    export class RouteErrorBoundary extends Component<
      RouteErrorBoundaryProps,
      RouteErrorBoundaryState
    > {
      state: RouteErrorBoundaryState = { hasError: false };

      static getDerivedStateFromError(): RouteErrorBoundaryState {
        return { hasError: true };
      }

      componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[route error]', error, info.componentStack);
      }

      render() {
        if (!this.state.hasError) {
          return this.props.children;
        }

        return (
          <div className="py-24 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
              This page failed to load. Reloading usually fixes it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-8 inline-flex items-center gap-x-2 rounded-full border border-border px-6 py-3 text-[15px] font-medium text-foreground hover:bg-surface active:scale-95 theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Reload the page
            </button>
          </div>
        );
      }
    }

Wrap the public route subtree, **outside** the `Suspense` so a rejected import is
caught rather than leaving the fallback spinning forever:

    // target — src/App.tsx:44-72, inside PublicShell's route element
              <PublicShell>
                <RouteErrorBoundary>
                  <Suspense
                    fallback={<p className="py-12 text-[15px] text-muted animate-pulse">Loading…</p>}
                  >
                    <Routes>
                      {/* unchanged */}
                    </Routes>
                  </Suspense>
                </RouteErrorBoundary>
              </PublicShell>

Do the same for the `/admin/*` route element at `src/App.tsx:38-44`.

`window.location.reload()` is the deliberate recovery action: for the stale-chunk
case a full reload fetches the new `index.html` and the new chunk hashes, which a
React-level retry cannot do.

**Known limitation, state it in the PR**: the boundary does not reset on
navigation, so after an error the visitor must reload or use the nav links (which
survive, because the boundary sits inside `PublicShell`). Resetting on route
change would need a `key={location.pathname}` on the boundary — do not add it in
this plan; it would also remount the route subtree on every navigation.

## Repo conventions to follow

- Every other component in `src/components/` is a function component; this one
  must be a class because `getDerivedStateFromError` has no hook equivalent. Note
  that in the file's doc comment.
- Copy the button styling verbatim from `src/components/Hero.tsx:128` — that is
  the repo's secondary-button pattern, and it already pairs `focus:outline-none`
  with a `focus-visible:ring`.
- Use the semantic colour tokens (`text-foreground`, `text-muted`, `border-border`,
  `bg-surface`, `theme-transition`), never raw colours — the app has two themes.
- Named type imports with the `type` keyword, as in `src/App.tsx:24`.

## Steps

1. Create `src/components/RouteErrorBoundary.tsx` with the content above.
2. In `src/App.tsx`, import it alongside the other component imports (lines 3-6).
3. Wrap the `Suspense` in the `path="*"` route element with `<RouteErrorBoundary>`.
4. Wrap the `Suspense` in the `path="/admin/*"` route element the same way.
5. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT wrap `Navigation` or `Footer` — they must stay alive so the visitor can
  navigate out of the error.
- Do NOT change the `lazy()` imports, the route table, or the `Suspense` fallback.
- Do NOT add a retry/reset mechanism beyond the reload button.
- Do NOT add `react-error-boundary` or any other dependency.
- Do NOT add error reporting to a third-party service — `console.error` only.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress. (Beyond the scan, so nothing clears.)
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check (must actually trigger it)**:
  1. `bun run build` then `bun run preview`. Open `/`, then in DevTools → Network
     add a block rule for `*/assets/*Projects*.js` (match the built chunk name for
     the Projects route). Click the "Projects" nav link. You must see the error UI
     **with the nav and footer still rendered**, not a blank page.
  2. Click "Reload the page" and confirm it recovers once the block is removed.
  3. Confirm the error UI renders correctly in both light and dark theme, and that
     the reload button shows a focus ring when reached by Tab.
  4. Remove the block and confirm normal navigation across all public routes is
     completely unchanged.
  5. Repeat (1) for an `/admin` chunk.
- **Done when**: a blocked chunk shows the error UI inside the shell instead of a
  white page, reload recovers, normal navigation is unaffected, the score is not
  lower, and typecheck passes.
