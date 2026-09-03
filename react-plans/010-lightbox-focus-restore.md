# 010 — Restore focus to the gallery tile when the lightbox closes

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~12 lines

## Problem

`src/components/ImageLightbox.tsx` opens a native modal from a callback ref and
closes by unmounting, so `dialog.close()` is never called and the browser's
native focus restore never fires:

    // src/components/ImageLightbox.tsx:12 — current
    export function ImageLightbox({ src, alt, onClose, onPrev, onNext }: ImageLightboxProps) {
      const dialogRef = useRef<HTMLDialogElement>(null);

      const openOnMount = useCallback((el: HTMLDialogElement | null) => {
        if (el && !el.open) el.showModal();
      }, []);

Note `dialogRef` is already declared but the element is wired to `openOnMount`
instead (`src/components/ImageLightbox.tsx:34`).

**User impact**: the lightbox is opened from `SpeakingGallery` (on `/` and
`/speaking`) and from the `/ui` screenshot grid. A keyboard user who opens image
7 of 12 and closes it lands on `<body>` and must Tab from the top of the page to
get back to the gallery — repeated for every image they look at.

`ConfirmDialog`, `ContactChoiceDialog` and `CoachingFormDialog` in this codebase
all call `close()`, so this is an inconsistency, not a house style.

## Target

Same shape as plan 009 — use the ref that already exists, open on mount, close
and restore focus on unmount:

    // target — src/components/ImageLightbox.tsx:12, replacing openOnMount
    export function ImageLightbox({ src, alt, onClose, onPrev, onNext }: ImageLightboxProps) {
      const dialogRef = useRef<HTMLDialogElement>(null);

      useEffect(() => {
        const dialog = dialogRef.current;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        if (dialog && !dialog.open) dialog.showModal();
        return () => {
          if (dialog?.open) dialog.close();
          previouslyFocused?.focus?.();
        };
      }, []);

and change the element at `src/components/ImageLightbox.tsx:34` from
`ref={openOnMount}` to `ref={dialogRef}`.

`useCallback` may become unused — check the rest of the file before removing it
from the import at line 1.

The explicit `previouslyFocused` capture is deliberate: `close()` alone restores
focus natively, but the cleanup runs while React is tearing the subtree down, so
native restore is not reliable here.

## Repo conventions to follow

- `src/components/CoachingFormDialog.tsx:85-99` is the in-repo exemplar for
  effect-driven `showModal()`/`close()` on a `useRef` dialog.
- Named React imports; this file already uses them.
- Keep `aria-label={alt}`, `onCancel`, and the ArrowLeft/ArrowRight effect exactly
  as they are — they are correct.

## Steps

1. Add `useEffect` to the React import in `src/components/ImageLightbox.tsx` (it
   is already imported — confirm) and remove `useCallback` only if it becomes unused.
2. Replace `openOnMount` with the open/close effect.
3. Change `ref={openOnMount}` to `ref={dialogRef}` at line 34.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the arrow-key prev/next effect at `src/components/ImageLightbox.tsx:19-31`.
- Do NOT change the backdrop-dismiss `onClick` guard at line 42 — React Doctor's
  `no-noninteractive-element-interactions` hit there was verified as a false
  positive (the dialog has a close button, `onCancel` Escape handling, and arrow
  keys); leave it alone.
- Do NOT change the callers (`SpeakingGallery`, `UiKit`).
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress; in particular `no-noninteractive-element-interactions` at
    `src/components/ImageLightbox.tsx:34` should remain the only diagnostic in
    this file and must not increase in count.
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check (keyboard, not optional)**: on `/speaking`:
  1. Tab to the **third** gallery tile and press Enter.
  2. Press ArrowRight twice — the image must still advance.
  3. Press Escape. Focus must return to the third tile, not `<body>`. Confirm by
     pressing Tab and checking the next focused element is the fourth tile.
  4. Repeat using the X close button and a backdrop click.
  5. Repeat the whole check on the `/ui` screenshot grid.
- **Done when**: focus returns to the originating tile in all three close paths,
  arrow navigation and Escape still work, the score is not lower, and typecheck passes.
