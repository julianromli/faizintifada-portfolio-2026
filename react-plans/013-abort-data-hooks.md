# 013 — Abort in-flight fetches in the five data hooks

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 5 files, ~10 lines each

## Problem

All five hand-rolled data hooks fetch without an `AbortController` and without
any unmount or ordering guard:

- `src/hooks/useGitHubContributions.ts`
- `src/hooks/useProjects.ts`
- `src/hooks/useSpeakingEvents.ts`
- `src/hooks/useYouTubeVideos.ts`
- `src/hooks/useProject.ts`

They share one shape. `useGitHubContributions` is representative:

    // src/hooks/useGitHubContributions.ts:21 — current
      const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
          const res = await fetch(apiUrl('/api/github/contributions'));
          if (!res.ok) {
            throw new Error(`GitHub contributions request failed (${res.status})`);
          }

          const data = (await res.json()) as GitHubContributions;
          setState({ contributions: data, loading: false, error: null });
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          setState({ contributions: null, loading: false, error });
        }
      }, []);

      useEffect(() => {
        void load();
      }, [load, nonce]);

Two consequences:

**(a) Wasted work and dead-tree commits.** Four of these fire on every `Home`
render (`src/pages/Home.tsx:15-19`). Leaving the homepage mid-load keeps the
requests open and commits state into an unmounted tree. `StrictMode` (enabled at
`src/main.tsx:14`) doubles each in development.

**(b) A real race in `useProject`.** This is the one hook whose key argument
changes while a request is in flight:

    // src/hooks/useProject.ts:28 — current
        setState({ project: undefined, loading: true, error: null });
        try {
          const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(slug)}`));

Navigating `/project/a` → `/project/b` while the first request is slow lets the
stale response resolve last and render project A under project B's URL.

The correct pattern already exists in this codebase, in the same feature:

    // src/components/unlumen-ui/github-graph.tsx:291 — the exemplar
        const controller = new AbortController();
        setResource({ status: 'loading' });

        fetch(`${CONTRIBUTIONS_ENDPOINT}/${normalizedAccount}?y=last`, {
          signal: controller.signal,
        })
        // ...
          .catch((error: unknown) => {
            if (controller.signal.aborted) return;
        // ...
        return () => controller.abort();

## Target

Thread an `AbortSignal` through `load`, pass it to `fetch`, bail out of every
`setState` when the signal is aborted, and abort in the effect cleanup. Applied
to `useGitHubContributions`:

    // target — src/hooks/useGitHubContributions.ts:21
      const load = useCallback(async (signal: AbortSignal) => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
          const res = await fetch(apiUrl('/api/github/contributions'), { signal });
          if (!res.ok) {
            throw new Error(`GitHub contributions request failed (${res.status})`);
          }

          const data = (await res.json()) as GitHubContributions;
          if (signal.aborted) return;
          setState({ contributions: data, loading: false, error: null });
        } catch (e) {
          if (signal.aborted) return;
          const error = e instanceof Error ? e : new Error(String(e));
          setState({ contributions: null, loading: false, error });
        }
      }, []);

      useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
      }, [load, nonce]);

Apply the identical transformation to the other four. Each has the same
`load = useCallback(async () => { ... })` + `useEffect(() => { void load(); }, [load, nonce])`
structure, so only the endpoint, the state field names, and the empty-state
values differ.

Two per-hook details:

- **`useProject`** has an early return when `slug` is falsy
  (`src/hooks/useProject.ts:23-25`) — keep it above the `try`, unchanged. Its
  404 branch (`setState({ project: null, ... })`) also needs the
  `if (signal.aborted) return;` guard before it.
- **`useSpeakingEvents`** sets two fields (`events` and `stats`) in both branches
  — guard both `setState` calls the same way.

The `if (signal.aborted) return;` in `catch` is what suppresses the `AbortError`
that `fetch` rejects with on abort. Without it, every unmount would flash an
error state.

Note the `setState((s) => ({ ...s, loading: true, error: null }))` at the top of
`load` needs no guard: it runs synchronously before the first `await`, while the
component is still mounted.

## Repo conventions to follow

- `src/components/unlumen-ui/github-graph.tsx:278-320` is the in-repo exemplar —
  `AbortController` created in the effect, `signal` passed to `fetch`,
  `signal.aborted` checked before each `setState`, `controller.abort()` in cleanup.
- Keep each hook's existing return shape, `retry`/`nonce` mechanism, state field
  names, and error-message strings exactly as they are.
- Named React imports; all five files already use them.
- Do not introduce a shared abstraction across the five hooks in this plan — five
  parallel small edits are the low-risk change. Extracting a shared
  `useFetch` is a separate decision.

## Steps

1. `src/hooks/useGitHubContributions.ts` — apply the target transformation.
2. `src/hooks/useProjects.ts` — same.
3. `src/hooks/useYouTubeVideos.ts` — same.
4. `src/hooks/useSpeakingEvents.ts` — same, guarding both `setState` calls.
5. `src/hooks/useProject.ts` — same, keeping the falsy-`slug` early return above
   the `try` and guarding the 404 branch.
6. Re-read the diff. All five should be near-identical edits; anything else is churn.

## Boundaries

- Do NOT change any hook's public return type, parameters, or error strings.
- Do NOT change the `retry`/`nonce` pattern.
- Do NOT add TanStack Query, SWR, or any other dependency — the stack
  deliberately has no data-fetching library.
- Do NOT touch `src/components/unlumen-ui/github-graph.tsx`; it is the exemplar
  and is already correct.
- Do NOT add caching or deduplication in this plan.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress. (Beyond the scan, so nothing clears.)
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check**:
  1. `bun run dev`. Open `/` with DevTools → Network throttled to "Slow 4G".
     While the four homepage requests are pending, navigate to `/projects`. In the
     Network panel the pending requests must show as **cancelled**, and no error
     state or React warning may appear in the console.
  2. **The `useProject` race, explicitly**: open `/project/<slug-a>`, and while it
     is loading navigate to `/project/<slug-b>`. Page B must render project B.
     Repeat several times with throttling on — before this change project A can win.
  3. Confirm each section still loads normally with throttling off, and that the
     `retry` path still works (block `/api/projects`, reload, use the retry
     control in `FeaturedProjects`, unblock, retry succeeds).
  4. Confirm the dev-only `StrictMode` double-fetch no longer leaves an orphan
     request pending.
- **Done when**: navigating away cancels in-flight requests, the `useProject` race
  resolves to the current slug every time, retry still works, no AbortError
  surfaces as a user-visible error, the score is not lower, and typecheck passes.
