# 007 — Make the mobile navigation menu keyboard-dismissible and focus-safe

- **Status**: DONE
- **Commit**: 318741a
- **Severity**: HIGH
- **Category**: Accessibility
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~45 lines

## Problem

`src/components/Navigation.tsx` renders a full-screen mobile menu with a backdrop
and locks page scroll, but implements none of the keyboard model a modal overlay
needs:

    // src/components/Navigation.tsx:45 — current (scroll lock, no focus model)
      useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => {
          document.body.style.overflow = '';
        };
      }, [menuOpen]);

    // src/components/Navigation.tsx:84 — current
          <AnimatePresence>
            {menuOpen ? (
              <div key="mobile-nav" className="md:hidden">
                <m.button
                  type="button"
                  className="fixed inset-0 z-40 bg-black/20"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                />
                <m.div
                  id="mobile-nav-menu"
                  className="fixed top-6 right-4 left-4 z-50 origin-top rounded-2xl border border-border bg-card p-6 shadow-lg theme-transition"

Three gaps, all confirmed by reading the whole 123-line file:

1. **No Escape handler.** The only ways to close are clicking the backdrop or the
   toggle. A keyboard user has no dismiss.
2. **No focus containment.** Tab walks straight out of the panel into the page
   content sitting behind the overlay — content the user cannot scroll to,
   because `document.body` overflow is hidden.
3. **No focus management.** Opening the menu leaves focus on the hamburger;
   closing it does not restore focus anywhere deliberate.

`aria-expanded` and `aria-controls` at `src/components/Navigation.tsx:75-76` are
already correct, which makes the missing behaviour the only gap.

**User impact**: on the mobile breakpoint — the majority of traffic — the primary
navigation is a trap for keyboard and switch-control users.

## Target

Add refs, an initial-focus + focus-trap + Escape effect, and focus return. Also
take the backdrop out of the tab order, since it sits outside the trapped panel.

    // target — add to the imports at src/components/Navigation.tsx:1
    import { useCallback, useEffect, useRef, useState } from 'react';

    // target — inside Navigation(), after the existing state
      const panelRef = useRef<HTMLDivElement>(null);
      const triggerRef = useRef<HTMLButtonElement>(null);

      const closeMenu = useCallback(() => setMenuOpen(false), []);

      // Focus the first menu link on open, trap Tab inside the panel, close on
      // Escape, and return focus to the trigger on close.
      useEffect(() => {
        if (!menuOpen) return;

        const panel = panelRef.current;
        panel?.querySelector<HTMLElement>('a[href]')?.focus();

        function onKeyDown(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            event.preventDefault();
            setMenuOpen(false);
            return;
          }
          if (event.key !== 'Tab' || !panel) return;

          const focusables = panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled])',
          );
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (!first || !last) return;

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => {
          document.removeEventListener('keydown', onKeyDown);
          triggerRef.current?.focus();
        };
      }, [menuOpen]);

Wire the refs and swap the inline close arrows for the stable `closeMenu`:

    // target — the toggle button at src/components/Navigation.tsx:72
            <button
              ref={triggerRef}
              type="button"
              className="flex items-center justify-center size-11 rounded-full border border-border text-muted hover:bg-surface hover:text-foreground active:scale-95 theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >

    // target — the backdrop at src/components/Navigation.tsx:87
                  <m.button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={closeMenu}
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  />

    // target — the panel at src/components/Navigation.tsx:97
                  <m.div
                    ref={panelRef}
                    id="mobile-nav-menu"
                    className="fixed top-6 right-4 left-4 z-50 origin-top rounded-2xl border border-border bg-card p-6 shadow-lg theme-transition"

The backdrop's `aria-label="Close menu"` is replaced by `aria-hidden="true"` +
`tabIndex={-1}`: it becomes a pure mouse-dismiss surface. Escape is now the
keyboard dismiss and the hamburger (whose `aria-label` already flips to
"Close menu") is the visible one, so no accessible affordance is lost.

The links inside the panel keep their existing `onClick={() => setMenuOpen(false)}`
at `src/components/Navigation.tsx:111`, or may use `closeMenu` — either is fine.

## Repo conventions to follow

- Named React imports (`import { useEffect, useRef, useState } from 'react'`) —
  this file already does that at line 1.
- `m.*` short forms only; `LazyMotion` runs in `strict` mode
  (`src/components/LazyMotionProvider.tsx:12`).
- `src/components/CoachingFormDialog.tsx:114-135` is the in-repo exemplar for an
  Escape-key effect: it attaches a `keydown` listener guarded on the open state
  and removes it in cleanup. Imitate that shape.
- The codebase uses `tabIndex={-1}` in four places already and no positive
  `tabIndex` anywhere — do not introduce one.

## Steps

1. Add `useCallback` and `useRef` to the React import at `src/components/Navigation.tsx:1`.
2. Add `panelRef`, `triggerRef` and `closeMenu` after the existing `useState`/`useLocation` lines.
3. Add the focus/Escape/trap effect. Place it after the existing body-overflow
   effect at line 45 so the scroll lock still runs first.
4. Attach `ref={triggerRef}` to the hamburger button, `ref={panelRef}` to the
   `m.div` panel, and change the backdrop to `tabIndex={-1} aria-hidden="true"`
   with `onClick={closeMenu}` (dropping its `aria-label`).
5. Walk the full keyboard check below on a narrow viewport.
6. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the desktop nav (`src/components/Navigation.tsx:61-68`) or `ThemeToggle`.
- Do NOT change the `AnimatePresence` structure, the motion variants at lines
  12-28, or the body-overflow effect.
- Do NOT change the render-phase ref block at `src/components/Navigation.tsx:38-43` —
  that is plan 008, and it must land **after** this one.
- Do NOT replace the menu with a native `<dialog>` or add a focus-trap library.
- Do NOT add dependencies.
- STOP if the code has drifted from commit `318741a`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics and the score
    does not regress. (Beyond the scan, so nothing clears.)
  - `bun run lint` (`tsc --noEmit`) passes.
- **Behavior check (keyboard, not optional)**: resize the viewport below the `md`
  breakpoint (< 768px), then on `/`:
  1. Tab to the hamburger and press Enter. Focus must land on the first menu link.
  2. Tab through the links — focus must cycle back to the first link, never
     reaching page content behind the overlay. Shift+Tab must cycle backwards.
  3. Press Escape. The menu must close **and** focus must return to the hamburger.
  4. Reopen, then activate a link with Enter. The menu must close and navigate.
  5. Reopen, then click the backdrop. The menu must close (mouse path intact).
  6. Confirm the exit animation still plays in cases 3-5.
- **Screen reader**: with VoiceOver, open the menu and confirm the hamburger
  announces its expanded state and that the backdrop is not announced as a
  separate "Close menu" button.
- **Done when**: Escape closes with focus returned, Tab is contained, mouse
  dismiss still works, animations are unchanged, the score is not lower, and
  typecheck passes.
