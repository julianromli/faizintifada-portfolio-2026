import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Envelope, InstagramLogo, WhatsappLogo } from '@phosphor-icons/react';
import { CONTACT_CHANNELS } from '../constants';
import { EASE_OUT, panelVariants, panelVariantsReduced } from '../lib/motion';

const CHANNEL_ICONS = {
  email: Envelope,
  whatsapp: WhatsappLogo,
  instagram: InstagramLogo,
} as const;

const iconContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};

const iconItemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export interface ContactChoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ContactChoiceDialog({ open, onClose }: ContactChoiceDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelMotion = shouldReduceMotion ? panelVariantsReduced : panelVariants;

  const handleEscape = useEffectEvent(() => {
    onClose();
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
      requestAnimationFrame(() => {
        firstLinkRef.current?.focus();
      });
    }
  }, [open]);

  function handleExitComplete() {
    const dialog = dialogRef.current;
    if (!open && dialog?.open) {
      dialog.close();
    }
  }

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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col theme-transition"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        className="fixed inset-0 -z-10 bg-transparent"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {open ? (
          <m.div
            key="contact-panel"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={panelMotion}
          >
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
              Get in touch
            </h2>
            <p className="mt-1 text-[14px] text-muted">Choose how you&apos;d like to reach me</p>
            <m.div
              className="mt-6 flex items-center justify-center gap-4"
              variants={shouldReduceMotion ? undefined : iconContainerVariants}
              initial={shouldReduceMotion ? false : 'hidden'}
              animate={shouldReduceMotion ? false : 'visible'}
            >
              {CONTACT_CHANNELS.map((channel, index) => {
                const IconComponent = CHANNEL_ICONS[channel.id];
                return (
                  <m.a
                    key={channel.id}
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={channel.href}
                    {...(channel.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    aria-label={channel.label}
                    variants={shouldReduceMotion ? undefined : iconItemVariants}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-transform duration-[160ms] ease-out hover:bg-surface active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card theme-transition"
                    onClick={() => onClose()}
                  >
                    <IconComponent
                      size={22}
                      weight={channel.id === 'email' ? 'regular' : 'fill'}
                    />
                  </m.a>
                );
              })}
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
