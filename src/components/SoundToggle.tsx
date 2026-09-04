import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useSound } from '../hooks/useSound';
import { EASE_OUT } from '../lib/motion';

const iconButtonClassName =
  'flex items-center justify-center size-11 rounded-full border border-border text-muted hover:bg-surface hover:text-foreground active:scale-[0.97] theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card';

const panelVariants = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.12, ease: EASE_OUT } },
};

const panelVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: EASE_OUT } },
};

function VolumeField({ idPrefix }: { idPrefix: string }) {
  const { volume, setVolume, playSound } = useSound();
  const reduceMotion = useReducedMotion();
  const volumeId = `${idPrefix}-volume`;
  const rangeRef = useRef<HTMLInputElement>(null);
  const percent = Math.round(volume * 100);

  useEffect(() => {
    const el = rangeRef.current;
    if (!el) return;

    function onCommit() {
      playSound('click');
    }

    el.addEventListener('change', onCommit);
    return () => el.removeEventListener('change', onCommit);
  }, [playSound]);

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={volumeId} className="text-[13px] font-medium text-foreground">
            Volume
          </label>
          <span className="text-[12px] text-muted tabular-nums">{percent}%</span>
        </div>
        <input
          ref={rangeRef}
          id={volumeId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
          className="h-6 w-full accent-foreground"
        />
      </div>

      {reduceMotion ? (
        <p className="text-pretty text-[12px] leading-relaxed text-muted">
          Sounds stay silent because you prefer reduced motion.
        </p>
      ) : null}
    </div>
  );
}

function SoundFields({ idPrefix }: { idPrefix: string }) {
  const { enabled, setEnabled, playSound } = useSound();

  return (
    <div className="space-y-3">
      <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[14px] font-medium text-foreground">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            const next = event.target.checked;
            setEnabled(next);
            if (next) playSound('click');
          }}
          className="size-4 accent-foreground"
        />
        UI sounds
      </label>
      <VolumeField idPrefix={idPrefix} />
    </div>
  );
}

function panelCoordsFromTrigger(trigger: HTMLElement): { top: number; right: number } {
  const rect = trigger.getBoundingClientRect();
  return {
    top: rect.bottom + 8,
    right: window.innerWidth - rect.right,
  };
}

export function SoundToggle() {
  const { enabled, volume } = useSound();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const muted = !enabled || volume <= 0;

  function syncCoords() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setCoords(panelCoordsFromTrigger(trigger));
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function onReposition() {
      syncCoords();
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={iconButtonClassName}
        aria-label="Sound settings"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => {
          setOpen((current) => {
            const next = !current;
            if (next) syncCoords();
            return next;
          });
        }}
      >
        {muted ? <SpeakerSlash size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && coords ? (
            <m.div
              ref={panelRef}
              id={panelId}
              key="sound-panel"
              aria-label="Sound settings"
              className="fixed z-[60] w-56 rounded-2xl border border-border bg-card p-4 shadow-lg theme-transition"
              style={{ top: coords.top, right: coords.right }}
              variants={reduceMotion ? panelVariantsReduced : panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <SoundFields idPrefix={panelId} />
            </m.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

const rowButtonClassName =
  'flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium text-muted hover:bg-surface/60 hover:text-foreground theme-transition';

export function SoundSettingsRow() {
  const { enabled, setEnabled, playSound } = useSound();
  const fieldId = useId();

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={rowButtonClassName}
        aria-pressed={enabled}
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
          if (next) playSound('click');
        }}
      >
        <span className="relative inline-flex size-[18px] items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {enabled ? (
              <m.span
                key="on"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              >
                <SpeakerHigh size={18} aria-hidden />
              </m.span>
            ) : (
              <m.span
                key="off"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              >
                <SpeakerSlash size={18} aria-hidden />
              </m.span>
            )}
          </AnimatePresence>
        </span>
        UI sounds
      </button>
      <div className="px-3 pb-2">
        <VolumeField idPrefix={fieldId} />
      </div>
    </div>
  );
}
