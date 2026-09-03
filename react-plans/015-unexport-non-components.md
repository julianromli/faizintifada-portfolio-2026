# 015 — Stop exporting non-components from component files

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: LOW
- **Category**: Maintainability & architecture
- **Rule**: react-doctor/only-export-components (×3)
- **Estimated scope**: 2 files, 3 lines

## Problem

Three non-component values are exported from files that also export React
components, which breaks Vite's Fast Refresh boundary — editing either file
triggers a **full page reload** in development instead of preserving component
state.

    // src/components/unlumen-ui/github-graph.tsx:95 — current
    /** Returns a valid GitHub handle without its optional @ prefix. */
    export function normalizeGithubAccount(account: string): string | null {

    // src/components/unlumen-ui/github-graph.tsx:101 — current
    /** Builds Sunday-first calendar columns and fills missing dates with level zero. */
    export function buildContributionWeeks(contributions: GithubContribution[]): GithubContributionWeek[] {

    // src/uploadthing/client.tsx:41 — current
    export { uploadThingUrl };

**Impact**: developer experience only — no user-facing defect. This is why the
finding is LOW. It matters because `github-graph.tsx` is the 497-line component
most likely to be iterated on with live state (a hovered cell, a loaded grid),
and a full reload throws that away on every save.

## Target

**None of the three has an external consumer.** Verified:

    grep -rn "normalizeGithubAccount\|buildContributionWeeks" src server scripts
    # → only the definitions and their two in-file call sites
    #   (github-graph.tsx:261 and :326)

    grep -rn "uploadThingUrl" src server
    # → only the definition, the in-file call at client.tsx:17, and the re-export

So the fix is simply to **drop the `export` keyword**. The canonical
`only-export-components` recipe describes moving utilities to a sibling file, but
that step exists to preserve importers — with none to preserve, un-exporting
satisfies the rule with strictly less churn and no new file. Take the simpler
route.

    // target — src/components/unlumen-ui/github-graph.tsx:95
    /** Returns a valid GitHub handle without its optional @ prefix. */
    function normalizeGithubAccount(account: string): string | null {

    // target — src/components/unlumen-ui/github-graph.tsx:101
    /** Builds Sunday-first calendar columns and fills missing dates with level zero. */
    function buildContributionWeeks(contributions: GithubContribution[]): GithubContributionWeek[] {

    // target — src/uploadthing/client.tsx:41
    // (delete the line entirely)

The **type** exports in `github-graph.tsx` (`GithubContribution`,
`GithubContributionCell`, `GithubContributionWeek`, `GithubGraphVariant`,
`GithubGraphAnimation`, `GithubGraphAmbientEffect`, `GithubGraphProps` — lines
5-21) must stay. TypeScript erases them at build time so they do not break the
Fast Refresh boundary, which is why React Doctor flags only lines 96 and 102.
`src/components/GitHubContributions.tsx:3` imports `GithubContribution` as a type
and would break if you removed it.

**Before deleting each `export`, re-run the two greps above yourself** and confirm
the only hits are the definition and in-file call sites. If any external importer
exists, do not un-export it — move that one symbol to a sibling
`github-graph-utils.ts` per the canonical recipe instead, and say so in the PR.

## Repo conventions to follow

- Keep the JSDoc comments above both functions exactly as they are.
- `github-graph.tsx` uses `import * as React`; do not touch its imports.
- Keep the functions where they are in the file; this plan changes visibility only.

## Steps

1. Re-run both greps above and confirm no external consumers.
2. `src/components/unlumen-ui/github-graph.tsx` — remove `export` from
   `normalizeGithubAccount` (line 96) and `buildContributionWeeks` (line 102).
3. `src/uploadthing/client.tsx` — delete the `export { uploadThingUrl };` line (41).
4. Re-read the diff. It must contain exactly three removals and nothing else.

## Boundaries

- Do NOT remove or change any `export type` / `export interface` in either file.
- Do NOT remove the `export function GithubGraph` or `export function ProjectImageDropzone`
  component exports.
- Do NOT move any function to a new file unless step 1 finds an external consumer.
- Do NOT reorder or reformat the surrounding code.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — all three `only-export-components`
    diagnostics clear and the score does not regress.
  - `bun run lint` (`tsc --noEmit`) passes. An "is declared but never used" or
    "has no exported member" error means step 1 was wrong — restore the export.
- **Behavior check (this is a Fast Refresh fix, so verify Fast Refresh)**:
  1. `bun run dev`, open `/`, scroll to the GitHub section and hover a cell so the
     tooltip is showing.
  2. Edit a string in `src/components/unlumen-ui/github-graph.tsx` (e.g. the
     `'contribution'` / `'contributions'` label) and save.
  3. Before this change the browser full-reloads and the grid re-runs its entrance
     animation. After it, the update should apply in place — the loaded grid stays
     loaded. Check the dev-server console for `hmr update` rather than a page reload.
  4. Open `/admin` → a project form with the image dropzone, and confirm uploads
     still work (`uploadThingUrl` is still called internally at line 17).
- **Done when**: the three diagnostics are clear, the score is not lower, typecheck
  passes, editing `github-graph.tsx` hot-updates instead of reloading, and the
  admin dropzone still uploads.
