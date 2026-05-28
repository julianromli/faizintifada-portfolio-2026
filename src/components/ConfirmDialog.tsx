import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';

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

  const handleEscape = useEffectEvent(() => {
    if (!busy) {
      onCancel();
    }
  });

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
    } else if (dialog.open) {
      dialog.close();
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
      ? 'rounded-full bg-red-700 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-red-800 disabled:opacity-50'
      : 'rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-gray-800 disabled:opacity-50';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        className="fixed inset-0 -z-10 bg-transparent"
        aria-label="Close dialog"
        disabled={busy}
        onClick={onCancel}
      />
      <h2 id={titleId} className="text-lg font-semibold tracking-tight text-gray-900">
        {title}
      </h2>
      <div id={descriptionId} className="mt-2 text-[15px] text-gray-600">
        {description}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-full border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button type="button" disabled={busy} onClick={onConfirm} className={confirmClassName}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
