import { useCallback, useEffect, useRef } from 'react';
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';

export interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ImageLightbox({ src, alt, onClose, onPrev, onNext }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openOnMount = useCallback((el: HTMLDialogElement | null) => {
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && onPrev) {
        event.preventDefault();
        onPrev();
      } else if (event.key === 'ArrowRight' && onNext) {
        event.preventDefault();
        onNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onPrev, onNext]);

  return (
    <dialog
      ref={openOnMount}
      aria-label={alt}
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/80 p-4 sm:p-8 backdrop:bg-black/80 open:flex"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X size={22} weight="bold" />
      </button>

      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous image"
          className="absolute left-2 sm:left-4 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CaretLeft size={22} weight="bold" />
        </button>
      ) : null}

      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          aria-label="Next image"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CaretRight size={22} weight="bold" />
        </button>
      ) : null}

      <img
        src={src}
        alt={alt}
        className="max-h-[calc(100vh-4rem)] max-w-full rounded-xl object-contain shadow-2xl"
      />
    </dialog>
  );
}
