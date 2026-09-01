import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { CheckCircle, Star, X } from '@phosphor-icons/react';
import {
  COACHING_TESTIMONIAL_HONEYPOT_FIELD,
  COACHING_TESTIMONIAL_RATING_OPTIONS,
} from '../lib/coaching-testimonial-options';
import { submitCoachingTestimonial } from '../lib/coaching-testimonial-api';
import type { CoachingTestimonialInput } from '../types/coaching-testimonial';
import { panelVariants, panelVariantsReduced } from '../lib/motion';

export interface TestimonialFormDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  role: string;
  rating: number;
  experience: string;
  outcome: string;
  agreedToPublish: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  role: '',
  rating: 0,
  experience: '',
  outcome: '',
  agreedToPublish: false,
};

const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5';
const inputClass =
  'w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-60 theme-transition';
const sectionClass = 'space-y-4';
const sectionTitleClass =
  'text-[12px] font-semibold uppercase tracking-wide text-muted';

export function TestimonialFormDialog({ open, onClose }: TestimonialFormDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelMotion = shouldReduceMotion ? panelVariantsReduced : panelVariants;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEscape = useEffectEvent(() => {
    if (!submitting) {
      onClose();
    }
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      window.requestAnimationFrame(() => firstFieldRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateLocal(): string | null {
    if (!form.name.trim()) return 'Nama wajib diisi.';
    if (!form.role.trim()) return 'Role lo wajib diisi.';
    if (form.rating < 1) return 'Kasih rating dulu.';
    if (!form.experience.trim()) return 'Ceritain pengalaman coaching-nya.';
    if (!form.agreedToPublish) return 'Lo harus mengizinkan testimoni ditampilkan.';
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const localError = validateLocal();
    if (localError) {
      setError(localError);
      return;
    }

    setError(null);
    setSubmitting(true);

    const input: CoachingTestimonialInput = {
      name: form.name.trim(),
      role: form.role.trim(),
      rating: form.rating,
      experience: form.experience.trim(),
      outcome: form.outcome.trim() || undefined,
      agreedToPublish: true,
    };

    try {
      const result = await submitCoachingTestimonial(input, honeypot);
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-3xl border border-border bg-card p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col theme-transition"
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
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Share Your Coaching Experience
              </h2>
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

            {success ? (
              <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <CheckCircle size={48} weight="fill" className="text-emerald-500" aria-hidden />
                <p className="text-lg font-medium text-foreground">Thanks for your feedback!</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-foreground px-6 py-2.5 text-[15px] font-medium text-canvas hover:bg-foreground/90 active:scale-[0.97] transition-transform theme-transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
                  {/* Honeypot — visually hidden, off-screen, not announced. */}
                  <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                    <label htmlFor="testimonial-hp">Company</label>
                    <input
                      id="testimonial-hp"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      name={COACHING_TESTIMONIAL_HONEYPOT_FIELD}
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {/* 1. About You */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>About You</h3>
                    <div>
                      <label htmlFor="testimonial-name" className={labelClass}>
                        Nama <span className="text-alert-error">*</span>
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="testimonial-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="testimonial-role" className={labelClass}>
                        Role <span className="text-alert-error">*</span>
                      </label>
                      <input
                        id="testimonial-role"
                        type="text"
                        required
                        value={form.role}
                        onChange={(e) => update('role', e.target.value)}
                        className={inputClass}
                        placeholder="Frontend Dev, Founder, dll"
                      />
                    </div>
                  </section>

                  {/* 2. Rating */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Rating</h3>
                    <div>
                      <span className={labelClass}>
                        Seberapa puas lo sama sesinya? <span className="text-alert-error">*</span>
                      </span>
                      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
                        {COACHING_TESTIMONIAL_RATING_OPTIONS.map((value) => {
                          const active = form.rating >= value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={form.rating === value}
                              aria-label={`${value} bintang`}
                              onClick={() => update('rating', value)}
                              className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 theme-transition"
                            >
                              <Star
                                size={26}
                                weight={active ? 'fill' : 'regular'}
                                className={active ? 'text-amber-400' : 'text-muted'}
                                aria-hidden
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  {/* 3. Your Experience */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Your Experience</h3>
                    <div>
                      <label htmlFor="testimonial-experience" className={labelClass}>
                        Gimana pengalaman coaching-nya? Apa yang paling berkesan?{' '}
                        <span className="text-alert-error">*</span>
                      </label>
                      <textarea
                        id="testimonial-experience"
                        required
                        rows={4}
                        value={form.experience}
                        onChange={(e) => update('experience', e.target.value)}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                    <div>
                      <label htmlFor="testimonial-outcome" className={labelClass}>
                        Setelah sesi, apa yang berubah / lo bisa lakuin sekarang?{' '}
                        <span className="font-normal text-muted">(opsional)</span>
                      </label>
                      <textarea
                        id="testimonial-outcome"
                        rows={3}
                        value={form.outcome}
                        onChange={(e) => update('outcome', e.target.value)}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                  </section>

                  {/* 4. Consent */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Consent</h3>
                    <label className="flex cursor-pointer items-start gap-3 text-[14px] text-foreground">
                      <input
                        type="checkbox"
                        checked={form.agreedToPublish}
                        onChange={(e) => update('agreedToPublish', e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 accent-foreground"
                      />
                      <span>
                        Gue ngizinin nama, role, dan testimoni ini ditampilkan secara publik.
                      </span>
                    </label>
                  </section>

                  {error ? <div className="alert alert-error">{error}</div> : null}
                </div>

                <div className="border-t border-border px-6 py-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-canvas hover:bg-foreground/90 active:scale-[0.99] transition-transform disabled:opacity-60 disabled:pointer-events-none theme-transition"
                  >
                    {submitting ? 'Mengirim…' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </m.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
