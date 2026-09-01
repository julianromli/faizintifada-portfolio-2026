import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { CheckCircle, X } from '@phosphor-icons/react';
import {
  COACHING_EXPERIENCE_OPTIONS,
  COACHING_HONEYPOT_FIELD,
  COACHING_IDE_OPTIONS,
  COACHING_OS_OPTIONS,
} from '../lib/coaching-options';
import { submitCoaching } from '../lib/coaching-api';
import type {
  CoachingExperience,
  CoachingIde,
  CoachingOs,
  CoachingSubmissionInput,
} from '../types/coaching';
import { panelVariants, panelVariantsReduced } from '../lib/motion';

export interface CoachingFormDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  contact: string;
  os: CoachingOs | '';
  ide: CoachingIde | '';
  ideOther: string;
  experience: CoachingExperience | '';
  about: string;
  goal: string;
  repoUrl: string;
  agreedToTerms: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  contact: '',
  os: '',
  ide: '',
  ideOther: '',
  experience: '',
  about: '',
  goal: '',
  repoUrl: '',
  agreedToTerms: false,
};

const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5';
const inputClass =
  'w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-60 theme-transition';
const sectionClass = 'space-y-4';
const sectionTitleClass =
  'text-[12px] font-semibold uppercase tracking-wide text-muted';

export function CoachingFormDialog({ open, onClose }: CoachingFormDialogProps) {
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
    if (!form.email.trim()) return 'Email wajib diisi.';
    if (!form.os) return 'Pilih OS lo.';
    if (!form.ide) return 'Pilih IDE lo.';
    if (!form.experience) return 'Pilih experience level lo.';
    if (!form.about.trim()) return 'Ceritain sedikit tentang lo.';
    if (!form.goal.trim()) return 'Isi dulu, mau build apa di sesi ini.';
    if (!form.agreedToTerms) return 'Lo harus menyetujui ketentuan sesi.';
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

    const input: CoachingSubmissionInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      contact: form.contact.trim() || undefined,
      os: form.os as CoachingOs,
      ide: form.ide as CoachingIde,
      ideOther: form.ide === 'other' ? form.ideOther.trim() || undefined : undefined,
      experience: form.experience as CoachingExperience,
      about: form.about.trim(),
      goal: form.goal.trim(),
      repoUrl: form.repoUrl.trim() || undefined,
      agreedToTerms: true,
    };

    try {
      const result = await submitCoaching(input, honeypot);
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
                Vibe Coding Coaching with Faiz Intifada
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
                <p className="text-lg font-medium text-foreground">Thanks for fill the form!</p>
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
                    <label htmlFor="coaching-hp">Company</label>
                    <input
                      id="coaching-hp"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      name={COACHING_HONEYPOT_FIELD}
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {/* 1. Personal Info */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Personal Info</h3>
                    <div>
                      <label htmlFor="coaching-name" className={labelClass}>
                        Nama <span className="text-alert-error">*</span>
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="coaching-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="coaching-email" className={labelClass}>
                        Email <span className="text-alert-error">*</span>
                      </label>
                      <input
                        id="coaching-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={inputClass}
                        placeholder="buat kirim rekaman & reminder"
                      />
                    </div>
                    <div>
                      <label htmlFor="coaching-contact" className={labelClass}>
                        WhatsApp / Telegram{' '}
                        <span className="font-normal text-muted">(opsional, recommended)</span>
                      </label>
                      <input
                        id="coaching-contact"
                        type="text"
                        value={form.contact}
                        onChange={(e) => update('contact', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </section>

                  {/* 2. Setup Check */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Setup Check</h3>
                    <div>
                      <label htmlFor="coaching-os" className={labelClass}>
                        OS <span className="text-alert-error">*</span>
                      </label>
                      <select
                        id="coaching-os"
                        required
                        value={form.os}
                        onChange={(e) => update('os', e.target.value as CoachingOs)}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Pilih OS
                        </option>
                        {COACHING_OS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="coaching-ide" className={labelClass}>
                        IDE <span className="text-alert-error">*</span>
                      </label>
                      <select
                        id="coaching-ide"
                        required
                        value={form.ide}
                        onChange={(e) => update('ide', e.target.value as CoachingIde)}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Pilih IDE
                        </option>
                        {COACHING_IDE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.ide === 'other' ? (
                      <div>
                        <label htmlFor="coaching-ide-other" className={labelClass}>
                          IDE lainnya
                        </label>
                        <input
                          id="coaching-ide-other"
                          type="text"
                          value={form.ideOther}
                          onChange={(e) => update('ideOther', e.target.value)}
                          className={inputClass}
                          placeholder="Sebutin IDE lo"
                        />
                      </div>
                    ) : null}
                    <div>
                      <label htmlFor="coaching-exp" className={labelClass}>
                        Experience level <span className="text-alert-error">*</span>
                      </label>
                      <select
                        id="coaching-exp"
                        required
                        value={form.experience}
                        onChange={(e) =>
                          update('experience', e.target.value as CoachingExperience)
                        }
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Pilih level
                        </option>
                        {COACHING_EXPERIENCE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  {/* 3. Project / Goals */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Project / Goals</h3>
                    <div>
                      <label htmlFor="coaching-about" className={labelClass}>
                        Ceritain sedikit tentang lo <span className="text-alert-error">*</span>
                      </label>
                      <textarea
                        id="coaching-about"
                        required
                        rows={3}
                        value={form.about}
                        onChange={(e) => update('about', e.target.value)}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                    <div>
                      <label htmlFor="coaching-goal" className={labelClass}>
                        Mau build apa di sesi ini? <span className="text-alert-error">*</span>
                      </label>
                      <textarea
                        id="coaching-goal"
                        required
                        rows={4}
                        value={form.goal}
                        onChange={(e) => update('goal', e.target.value)}
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                    <div>
                      <label htmlFor="coaching-repo" className={labelClass}>
                        Link repo / GitHub{' '}
                        <span className="font-normal text-muted">(opsional)</span>
                      </label>
                      <input
                        id="coaching-repo"
                        type="text"
                        value={form.repoUrl}
                        onChange={(e) => update('repoUrl', e.target.value)}
                        className={inputClass}
                        placeholder="https://github.com/…"
                      />
                    </div>
                  </section>

                  {/* 4. Agreement */}
                  <section className={sectionClass}>
                    <h3 className={sectionTitleClass}>Agreement</h3>
                    <label className="flex cursor-pointer items-start gap-3 text-[14px] text-foreground">
                      <input
                        type="checkbox"
                        checked={form.agreedToTerms}
                        onChange={(e) => update('agreedToTerms', e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 accent-foreground"
                      />
                      <span>
                        Sesi 2 jam, rekaman dikirim via email/WhatsApp group dalam 24 jam,
                        reschedule H-24, no refund.
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
