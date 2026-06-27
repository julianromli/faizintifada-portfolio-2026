import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from '@phosphor-icons/react';
import { createCheckout } from '../lib/checkout-api';
import { UI_KIT } from '../constants';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.16, ease: EASE_OUT } },
};

const panelVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};

const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5';
const inputClass =
  'w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-60 theme-transition';

function formatIDR(amount: number) {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CheckoutDialog({ open, onClose }: CheckoutDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelMotion = shouldReduceMotion ? panelVariantsReduced : panelVariants;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEscape = useEffectEvent(() => {
    if (!submitting) onClose();
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      setError(null);
      window.requestAnimationFrame(() => firstFieldRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName('');
      setEmail('');
      setMobile('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleEscape();
      }
    }
    dialog.addEventListener('keydown', onKeyDown);
    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (mobile.trim().length < 6) return setError('Please enter your WhatsApp number.');

    setError(null);
    setSubmitting(true);

    const result = await createCheckout({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
    });

    if (result.ok) {
      // Hand off to Mayar's hosted payment page.
      window.location.href = result.link;
      return;
    }

    setSubmitting(false);
    setError(result.message);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-3xl border border-border bg-card p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col theme-transition"
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting) onClose();
      }}
    >
      <AnimatePresence>
        {open ? (
          <m.div
            key="panel"
            variants={panelMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex max-h-[85vh] flex-col"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  Get {UI_KIT.name}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  {formatIDR(UI_KIT.price.amount)} · one-time · lifetime access
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close"
                className="-mr-1.5 -mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground disabled:opacity-50 theme-transition"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
                <div>
                  <label htmlFor="checkout-name" className={labelClass}>
                    Name
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="where we send your access"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-mobile" className={labelClass}>
                    WhatsApp number
                  </label>
                  <input
                    id="checkout-mobile"
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className={inputClass}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                {error ? <div className="alert alert-error">{error}</div> : null}

                <p className="text-[12px] leading-relaxed text-muted">
                  You'll be redirected to Mayar to pay securely. Your access token and
                  install instructions are emailed right after payment.
                </p>
              </div>

              <div className="border-t border-border px-6 py-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-embossed px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60 disabled:pointer-events-none focus:outline-none"
                >
                  {submitting ? 'Starting checkout…' : 'Continue to payment'}
                  {!submitting ? <ArrowUpRight size={16} weight="bold" /> : null}
                </button>
              </div>
            </form>
          </m.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
