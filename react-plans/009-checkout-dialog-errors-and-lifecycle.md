# 009 — Announce checkout errors, gate Escape during submit, restore focus on close

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Accessibility + Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~35 lines

## Problem

Three defects in `src/components/CheckoutDialog.tsx`, all on the only revenue
path in the app. They are one plan because they share a file and the same
lifecycle.

**(a) Errors are never announced.** Both error surfaces are plain elements with
no live region and no association to the field they describe:

    // src/components/CheckoutDialog.tsx:294 — current
                  {state.couponError ? (
                    <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">{state.couponError}</p>
                  ) : null}

    // src/components/CheckoutDialog.tsx:299 — current
                {state.error ? <div className="alert alert-error">{state.error}</div> : null}

The app contains **zero** live regions anywhere — verified:
`grep -rn 'aria-live\|role="alert"\|role="status"' src` returns nothing. A screen
reader user who submits an invalid coupon or a failing checkout gets silence.

**(b) Escape during submit silently discards a failed payment attempt.** The
close button is correctly disabled while busy, but `onCancel` is not gated:

    // src/components/CheckoutDialog.tsx:177 — current (ungated)
          onCancel={(event) => {
            event.preventDefault();
            requestClose();
          }}

    // src/components/CheckoutDialog.tsx:213 — current (correctly gated)
              <button
                type="button"
                onClick={requestClose}
                disabled={busy}

Pressing Escape mid-`createCheckout` starts the exit animation and unmounts the
dialog, so the `dispatch({ type: 'submitError', ... })` at
`src/components/CheckoutDialog.tsx:169` lands on a dead reducer. The buyer sees
the dialog vanish and is told nothing.

**(c) Focus is never restored.** The dialog opens with `showModal()` from a
callback ref and closes by **unmounting** — `dialog.close()` is never called, so
the browser's native modal focus restore never fires and focus drops to `<body>`:

    // src/components/CheckoutDialog.tsx:97 — current
      const openOnMount = useCallback((el: HTMLDialogElement | null) => {
        if (el && !el.open) el.showModal();
      }, []);

`ConfirmDialog`, `ContactChoiceDialog` and `CoachingFormDialog` in this same
codebase all call `close()`, so this is an inconsistency, not a house style.

## Target

**(a) Announce both errors and describe the coupon field.**

    // target — src/components/CheckoutDialog.tsx:294
                  {state.couponError ? (
                    <p
                      id="checkout-coupon-error"
                      role="alert"
                      className="mt-1.5 text-[12px] text-red-600 dark:text-red-400"
                    >
                      {state.couponError}
                    </p>
                  ) : null}

    // target — src/components/CheckoutDialog.tsx:299
                {state.error ? (
                  <div role="alert" className="alert alert-error">
                    {state.error}
                  </div>
                ) : null}

and on the coupon input (currently `id="checkout-coupon"`), add the association:

    // target — added to the coupon <input>
                    aria-invalid={state.couponError ? true : undefined}
                    aria-describedby={state.couponError ? 'checkout-coupon-error' : undefined}

Both error nodes are conditionally mounted, so `role="alert"` (an implicit
assertive live region) announces on insertion. Do not add `aria-live` as well —
that would double-announce.

**(b) Gate Escape on the same `busy` flag the close button uses.**

    // target — src/components/CheckoutDialog.tsx:177
          onCancel={(event) => {
            event.preventDefault();
            if (busy) return;
            requestClose();
          }}

`event.preventDefault()` stays first so the native dialog never self-closes,
which is what would otherwise unmount the panel mid-request.

**(c) Restore focus on close.** Replace the callback ref with a real ref plus an
effect that opens on mount and closes + restores focus on unmount:

    // target — src/components/CheckoutDialog.tsx:97, replacing openOnMount
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

and change the element at `src/components/CheckoutDialog.tsx:174` from
`ref={openOnMount}` to `ref={dialogRef}`.

The explicit `previouslyFocused` capture is deliberate: `dialog.close()` alone
restores focus natively, but the cleanup runs while React is tearing the subtree
down, so native restore is not reliable here. Capturing and restoring ourselves
is deterministic. Keep both — `close()` also releases the top layer and the
`::backdrop`.

Update the doc comment at `src/components/CheckoutDialog.tsx:86-89`, which
currently states the dialog "closes when unmounted"; that stays true, but it now
also calls `close()` and restores focus.

## Repo conventions to follow

- `src/components/CoachingFormDialog.tsx:85-99` is the in-repo exemplar for an
  effect that drives `showModal()`/`close()` on a `useRef` dialog. Imitate its shape.
- Named React imports; add `useEffect` and `useRef` to the existing import line.
- Error copy on this page is English (the coaching forms are Indonesian) — do not
  change any user-facing string.
- `alert alert-error` is an existing class in `src/index.css`; keep it and add the
  role to the same element rather than wrapping it.

## Steps

1. Add `useEffect` and `useRef` to the React import in `src/components/CheckoutDialog.tsx`.
2. Replace `openOnMount` with `dialogRef` + the open/close effect; change
   `ref={openOnMount}` to `ref={dialogRef}` at line 174.
3. Add the `if (busy) return;` guard inside `onCancel` at line 177.
4. Add `role="alert"` + `id` to the coupon error, `role="alert"` to the submit
   error, and `aria-invalid`/`aria-describedby` to the coupon input.
5. Update the component doc comment at lines 86-89.
6. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the reducer, its actions, `validateCoupon`, or `createCheckout`.
- Do NOT change any user-facing copy, price formatting, or the redirect at
  `src/components/CheckoutDialog.tsx:165`.
- Do NOT change the `AnimatePresence` / `closing` exit-animation flow.
- Do NOT change the submit button's `focus:outline-none` — plan 006 owns the
  focus ring, in CSS.
- Do NOT apply the same error-announcement fix to `CoachingFormDialog` or
  `TestimonialFormDialog` in this plan; those were not selected for this round.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress. (Beyond the scan, so nothing clears.)
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check**: on `/ui`, open the checkout dialog and confirm:
  1. **Focus restore** — Tab to the button that opens the dialog, press Enter,
     then close with the X, with Escape, and by clicking the backdrop. In all
     three cases focus must return to the button that opened it, not `<body>`.
  2. **Escape gating** — enter valid details, submit, and press Escape while
     "Starting checkout…" is showing. The dialog must stay open. Then let the
     request fail (DevTools → Network → block `/api/checkout`) and confirm the
     error message appears instead of the dialog vanishing.
  3. **Coupon error** — apply a nonsense coupon code; the inline error appears and
     the input is marked invalid.
- **Screen reader (not optional for this plan)**: with VoiceOver running
  (Cmd+F5), repeat (3) and the blocked-request case in (2). Both error messages
  must be spoken **without moving the cursor**. Also Tab onto the coupon input
  while an error is showing and confirm the error text is read as its description.
- **Done when**: focus returns to the opener in all three close paths, Escape is
  inert during submit and the failure message shows, both errors are announced by
  VoiceOver, the score is not lower, and typecheck passes.
