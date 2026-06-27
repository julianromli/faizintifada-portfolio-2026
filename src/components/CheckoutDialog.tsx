import { useCallback, useReducer, type FormEvent } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from '@phosphor-icons/react';
import { createCheckout, validateCoupon } from '../lib/checkout-api';
import { UI_KIT } from '../constants';
import type { AppliedCoupon } from '../types/coupon';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
};

const panelVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
};

const labelClass = 'block text-[13px] font-medium text-foreground mb-1.5';
const inputClass =
  'w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-60 theme-transition';

function formatIDR(amount: number) {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

type FormState = {
  name: string;
  email: string;
  mobile: string;
  couponInput: string;
  applied: AppliedCoupon | null;
  applyingCoupon: boolean;
  couponError: string | null;
  submitting: boolean;
  error: string | null;
};

type FormAction =
  | { type: 'field'; key: 'name' | 'email' | 'mobile'; value: string }
  | { type: 'couponInput'; value: string }
  | { type: 'applyStart' }
  | { type: 'applySuccess'; applied: AppliedCoupon }
  | { type: 'applyError'; message: string }
  | { type: 'submitStart' }
  | { type: 'submitError'; message: string };

const INITIAL: FormState = {
  name: '',
  email: '',
  mobile: '',
  couponInput: '',
  applied: null,
  applyingCoupon: false,
  couponError: null,
  submitting: false,
  error: null,
};

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'field':
      return { ...state, [action.key]: action.value };
    case 'couponInput': {
      const next = action.value;
      const applied =
        state.applied && next.trim().toUpperCase() === state.applied.code ? state.applied : null;
      return { ...state, couponInput: next, applied, couponError: null };
    }
    case 'applyStart':
      return { ...state, applyingCoupon: true, couponError: null };
    case 'applySuccess':
      return {
        ...state,
        applyingCoupon: false,
        applied: action.applied,
        couponInput: action.applied.code,
        couponError: null,
      };
    case 'applyError':
      return { ...state, applyingCoupon: false, applied: null, couponError: action.message };
    case 'submitStart':
      return { ...state, submitting: true, error: null };
    case 'submitError':
      return { ...state, submitting: false, error: action.message };
    default:
      return state;
  }
}

export interface CheckoutDialogProps {
  /** Render only when opening; the dialog opens itself on mount and closes by unmounting. */
  onClose: () => void;
}

/**
 * Native modal checkout dialog. Mount it (e.g. `{open && <CheckoutDialog .../>}`) to show it;
 * it calls `showModal()` from a ref callback on mount and closes when unmounted — so there is
 * no prop-synced effect, and the form state is naturally fresh on each open.
 */
export function CheckoutDialog({ onClose }: CheckoutDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const panelMotion = shouldReduceMotion ? panelVariantsReduced : panelVariants;
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const openOnMount = useCallback((el: HTMLDialogElement | null) => {
    if (el && !el.open) el.showModal();
  }, []);

  const displayAmount = state.applied?.finalAmount ?? UI_KIT.price.amount;
  const busy = state.submitting || state.applyingCoupon;

  async function handleApplyCoupon() {
    const code = state.couponInput.trim();
    if (!code) {
      dispatch({ type: 'applyError', message: 'Enter a coupon code.' });
      return;
    }

    dispatch({ type: 'applyStart' });
    const result = await validateCoupon(code);
    if (!result.valid) {
      dispatch({ type: 'applyError', message: result.error });
      return;
    }

    dispatch({ type: 'applySuccess', applied: result });
  }

  async function resolveCouponForCheckout(): Promise<AppliedCoupon | null | 'invalid'> {
    const typed = state.couponInput.trim();
    if (!typed) return null;

    if (state.applied && typed.toUpperCase() === state.applied.code) {
      return state.applied;
    }

    const result = await validateCoupon(typed);
    if (!result.valid) {
      dispatch({ type: 'submitError', message: result.error });
      return 'invalid';
    }

    dispatch({ type: 'applySuccess', applied: result });
    return result;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.submitting) return;

    if (!state.name.trim()) return dispatch({ type: 'submitError', message: 'Please enter your name.' });
    if (!state.email.trim()) return dispatch({ type: 'submitError', message: 'Please enter your email.' });
    if (state.mobile.trim().length < 6) {
      return dispatch({ type: 'submitError', message: 'Please enter your WhatsApp number.' });
    }

    dispatch({ type: 'submitStart' });

    const applied = await resolveCouponForCheckout();
    if (applied === 'invalid') return;

    const result = await createCheckout({
      name: state.name.trim(),
      email: state.email.trim(),
      mobile: state.mobile.trim(),
      couponCode: applied?.code,
    });

    if (result.ok) {
      window.location.href = result.link;
      return;
    }

    dispatch({ type: 'submitError', message: result.message });
  }

  return (
    <dialog
      ref={openOnMount}
      aria-label={`Get ${UI_KIT.name}`}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-3xl border border-border bg-card p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col theme-transition"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <m.div
        variants={panelMotion}
        initial="hidden"
        animate="visible"
        className="flex max-h-[85vh] flex-col"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Get {UI_KIT.name}
            </h2>
            {state.applied ? (
              <div className="mt-0.5 space-y-0.5">
                <p className="text-[13px] text-muted line-through">{formatIDR(state.applied.checkoutPrice)}</p>
                <p className="text-[13px] font-medium text-foreground">
                  {formatIDR(displayAmount)} · {state.applied.discountLabel} · lifetime access
                </p>
              </div>
            ) : (
              <p className="mt-0.5 text-[13px] text-muted">
                {formatIDR(UI_KIT.price.amount)} · one-time · lifetime access
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
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
                id="checkout-name"
                type="text"
                required
                value={state.name}
                onChange={(e) => dispatch({ type: 'field', key: 'name', value: e.target.value })}
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
                value={state.email}
                onChange={(e) => dispatch({ type: 'field', key: 'email', value: e.target.value })}
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
                value={state.mobile}
                onChange={(e) => dispatch({ type: 'field', key: 'mobile', value: e.target.value })}
                className={inputClass}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="checkout-coupon" className={labelClass}>
                Coupon code
              </label>
              <div className="flex gap-2">
                <input
                  id="checkout-coupon"
                  type="text"
                  value={state.couponInput}
                  onChange={(e) => dispatch({ type: 'couponInput', value: e.target.value })}
                  className={inputClass}
                  placeholder="Optional"
                  autoComplete="off"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={busy || !state.couponInput.trim()}
                  className="shrink-0 rounded-xl border border-border px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-surface disabled:opacity-50 theme-transition"
                >
                  {state.applyingCoupon ? 'Applying…' : 'Apply'}
                </button>
              </div>
              {state.applied ? (
                <p className="mt-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
                  Coupon applied — you pay {formatIDR(state.applied.finalAmount)}.
                </p>
              ) : null}
              {state.couponError ? (
                <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">{state.couponError}</p>
              ) : null}
            </div>

            {state.error ? <div className="alert alert-error">{state.error}</div> : null}

            <p className="text-[12px] leading-relaxed text-muted">
              {displayAmount === 0
                ? 'No payment needed — your access token and install instructions are emailed right after you continue.'
                : "You'll be redirected to Mayar to pay securely. Your access token and install instructions are emailed right after payment."}
            </p>
          </div>

          <div className="border-t border-border px-6 py-4">
            <button
              type="submit"
              disabled={state.submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full btn-embossed px-6 py-3 text-[15px] font-medium text-white disabled:opacity-60 disabled:pointer-events-none focus:outline-none"
            >
              {state.submitting
                ? 'Starting checkout…'
                : displayAmount === 0
                  ? 'Get access'
                  : 'Continue to payment'}
              {!state.submitting ? <ArrowUpRight size={16} weight="bold" /> : null}
            </button>
          </div>
        </form>
      </m.div>
    </dialog>
  );
}
