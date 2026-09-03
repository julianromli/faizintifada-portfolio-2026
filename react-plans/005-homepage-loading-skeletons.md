# 005 — Reserve space for the three async homepage sections

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: MEDIUM
- **Category**: Performance
- **Rule**: Beyond the scan
- **Estimated scope**: 3 files, small

## Problem

Three of the seven homepage sections render nothing while their independent
fetches are in flight, then mount a full-height block when data arrives —
pushing everything below them down.

    // src/components/SpeakingEvents.tsx:35 — current
      if (loading || error || events.length === 0) {
        return null;
      }

    // src/components/LatestVideos.tsx:58 — current
      if (loading || error || videos.length === 0) {
        return null;
      }

    // src/components/GitHubContributions.tsx:23 — current
      if (loading || error || !contributions || !data || data.length === 0) {
        return null;
      }

They sit consecutively in `src/pages/Home.tsx:15-19`, between `FeaturedProjects`
and `ToolsStack`, and each fetch resolves independently — so a visitor sees up to
three separate late inserts stacked in one scroll column.

**User impact**: cumulative layout shift on the site's primary landing page. A
visitor reading `AboutSection` or reaching for a link can have the content jump
under the pointer as each section arrives.

`FeaturedProjects` already solves this correctly and is the exemplar:

    // src/components/FeaturedProjects.tsx:50 — current (correct)
          {loading && <ProjectsGridSkeleton />}

## Target

Split the single guard into a loading branch that reserves space and an
empty/error branch that still collapses. Errors and genuinely-empty sections
should keep returning `null` — reserving space for content that will never
arrive is its own layout bug.

    // target — src/components/SpeakingEvents.tsx
      if (loading) {
        return <SpeakingEventsSkeleton />;
      }
      if (error || events.length === 0) {
        return null;
      }

    // target — src/components/LatestVideos.tsx
      if (loading) {
        return <LatestVideosSkeleton />;
      }
      if (error || videos.length === 0) {
        return null;
      }

    // target — src/components/GitHubContributions.tsx
      if (loading) {
        return <GitHubContributionsSkeleton />;
      }
      if (error || !contributions || !data || data.length === 0) {
        return null;
      }

Each skeleton is a local, non-exported component in the same file, built from the
repo's `Skeleton` primitive and sized to match the real section's height. Model
them on `ProjectsGridSkeleton`:

    // src/components/ProjectCard.tsx:91 — the exemplar to imitate
    export function ProjectsGridSkeleton() {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[0, 1, 2].map((k) => (
            <div key={k} className="space-y-4">
              <Skeleton
                className="aspect-[4/3] rounded-[1rem]"
                style={{ animationDelay: `${k * 80}ms` }}
              />
              <div className="space-y-2 px-1">
                <Skeleton variant="text" className="w-2/3" style={{ animationDelay: `${k * 80}ms` }} />
                <Skeleton variant="text" muted className="h-3 w-full" style={{ animationDelay: `${k * 80}ms` }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

For `GitHubContributions` specifically, `github-graph.tsx` already exports a
`LoadingGraph` shape used at `src/components/unlumen-ui/github-graph.tsx:362` —
but importing it would pull the lazy chunk into the eager path. Build a plain
`Skeleton` block sized to the real grid instead (the rendered grid is 7 rows at
`cellSize={14}` + `cellGap={3}`, inside a `rounded-[1rem] border p-5 sm:p-6`
container — reproduce that container and put one `Skeleton` of the right height
inside it).

**Match the real heights.** Load each section with data, measure the rendered
section height in DevTools, and size the skeleton to within ~10px. A skeleton of
the wrong height replaces one layout shift with a smaller one instead of
removing it.

## Repo conventions to follow

- `src/components/Skeleton.tsx` is the primitive; it supports `variant="text"`,
  `muted`, `className`, and `style` (used for staggered `animationDelay`).
- Section headings and the surrounding `<section>` wrapper should render in the
  skeleton too, so the heading does not itself pop in. See how `FeaturedProjects`
  keeps its header outside the `loading` branch.
- Keep skeleton components **unexported** and defined above the section component
  in the same file — except where the repo already exports one (`ProjectCard.tsx`).
  Do not add new exports to files that would then trip `only-export-components`.
- Tailwind v4 utility classes only; no new CSS.

## Steps

1. In `src/components/SpeakingEvents.tsx`, add a local `SpeakingEventsSkeleton`
   and split the guard at line 35.
2. In `src/components/LatestVideos.tsx`, add a local `LatestVideosSkeleton` and
   split the guard at line 58.
3. In `src/components/GitHubContributions.tsx`, add a local
   `GitHubContributionsSkeleton` and split the guard at line 23.
4. Measure each real section's height with data present and tune the skeleton
   heights to match.
5. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change any data hook, fetch, or the `useMemo` at
  `src/components/GitHubContributions.tsx:13`.
- Do NOT make the error or empty branches render a skeleton — those must keep
  returning `null`.
- Do NOT change `src/pages/Home.tsx`.
- Do NOT change the `GithubGraph` props or its own internal `LoadingGraph`.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics (watch for
    `only-export-components` if you export a skeleton) and the score does not regress.
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check**: In DevTools → Network, throttle to "Slow 4G" and reload `/`.
  All three sections must show a placeholder immediately and swap to real content
  **in place**, with no visible downward push of the content below. Then block
  `/api/github/contributions` (right-click → Block request URL) and reload: that
  section must collapse to nothing, not leave an empty skeleton.
- **Metric (not optional)**: Run Lighthouse (mobile, simulated throttling) on `/`
  before and after. Record both **Cumulative Layout Shift** values in the PR
  description; CLS must go down.
- **Done when**: the score is not lower, typecheck passes, throttled load shows no
  section-insert jump, error/empty states still collapse, and the CLS number improved.
