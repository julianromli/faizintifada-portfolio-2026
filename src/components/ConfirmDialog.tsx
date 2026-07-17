import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { EASE_OUT, panelVariants, panelVariantsReduced } from '../lib/motion';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelMotion = shouldReduceMotion ? panelVariantsReduced : panelVariants;

  const handleEscape = useEffectEvent(() => {
    if (!busy) {
      onCancel();
    }
  });

  function closeDialog() {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleEscape();
      }
    }

    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const confirmClassName =
    variant === 'danger'
      ? 'inline-flex min-h-10 items-center rounded-full bg-red-700 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-red-800 active:scale-[0.96] transition-transform disabled:opacity-50'
      : 'inline-flex min-h-10 items-center rounded-full bg-foreground px-5 py-2.5 text-[14px] font-medium text-canvas hover:bg-foreground/90 active:scale-[0.96] transition-transform disabled:opacity-50';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-transparent p-0 backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
    >
      <AnimatePresence onExitComplete={closeDialog}>
        {open ? (
          <m.div key="confirm-root" className="fixed inset-0 flex items-center justify-center p-4">
            <m.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            />
            <m.div
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl theme-transition"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={panelMotion}
            >
              <h2 id={titleId} className="text-balance text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <div id={descriptionId} className="mt-2 text-pretty text-[15px] text-muted">
                {description}
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  ref={cancelRef}
                  type="button"
                  disabled={busy}
                  onClick={onCancel}
                  className="inline-flex min-h-10 items-center rounded-full border border-border px-5 py-2.5 text-[14px] font-medium text-foreground hover:bg-surface active:scale-[0.96] transition-transform disabled:opacity-50 theme-transition"
                >
                  {cancelLabel}
                </button>
                <button type="button" disabled={busy} onClick={onConfirm} className={confirmClassName}>
                  {busy ? 'Working…' : confirmLabel}
                </button>
              </div>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
