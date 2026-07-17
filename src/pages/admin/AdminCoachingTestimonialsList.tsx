import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  EASE_OUT,
  panelVariants,
  panelVariantsReduced,
  staggerContainer,
  staggerItemOpacity,
} from '../../lib/motion';
import { Star, Trash } from '@phosphor-icons/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  fetchCoachingTestimonials,
  deleteCoachingTestimonial,
} from '../../lib/coaching-testimonial-admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminBtnDestructive,
  adminTableContainer,
  adminTableDivide,
  adminTableHead,
  adminTableRow,
} from '../../lib/admin-styles';
import type { CoachingTestimonial } from '../../types/coaching-testimonial';

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <m.span
          key={v}
          className="inline-flex"
          initial={{ opacity: 0, scale: 0.25 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0, delay: v * 0.04 }}
        >
          <Star
            size={15}
            weight={v <= rating ? 'fill' : 'regular'}
            className={v <= rating ? 'text-amber-400' : 'text-muted'}
            aria-hidden
          />
        </m.span>
      ))}
    </span>
  );
}

export function AdminCoachingTestimonialsList() {
  const [items, setItems] = useState<CoachingTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CoachingTestimonial | null>(null);
  const [detail, setDetail] = useState<CoachingTestimonial | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCoachingTestimonials();
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function requestDelete(item: CoachingTestimonial) {
    setActionError(null);
    setActionSuccess(null);
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setBusyId(id);
    try {
      await deleteCoachingTestimonial(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setActionSuccess(`Deleted testimonial from “${pendingDelete.name}”.`);
      setPendingDelete(null);
      if (detail?.id === id) setDetail(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete testimonial?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium text-foreground">{pendingDelete.name}</span>
              <span className="block mt-2">This cannot be undone.</span>
            </>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        busy={pendingDelete !== null && busyId === pendingDelete.id}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      <TestimonialDetailDialog testimonial={detail} onClose={() => setDetail(null)} />

      <div className="space-y-6">
        {actionError && <div className={adminAlertError}>{actionError}</div>}
        {actionSuccess && <div className={adminAlertSuccess}>{actionSuccess}</div>}

        {loading && (
          <div className="space-y-2.5">
            <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
            <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
            <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
            <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-warning space-y-2">
            <p>{error}</p>
            <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center underline font-medium">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-[15px] text-muted">No testimonials yet.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className={adminTableContainer}>
            <table className="w-full text-left text-[14px]">
              <thead className={adminTableHead}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <m.tbody className={`divide-y ${adminTableDivide}`} initial="hidden" animate="show" variants={staggerContainer}>
                {items.map((t) => (
                  <m.tr
                    key={t.id}
                    className={`${adminTableRow} cursor-pointer hover:bg-surface theme-transition`}
                    onClick={() => setDetail(t)}
                    variants={staggerItemOpacity}
                  >
                    <td className="px-4 py-3 text-foreground">{t.name}</td>
                    <td className="px-4 py-3 text-muted">{t.role}</td>
                    <td className="px-4 py-3">
                      <RatingStars rating={t.rating} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busyId === t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(t);
                        }}
                        className={adminBtnDestructive}
                      >
                        <Trash size={18} aria-hidden />
                        Delete
                      </button>
                    </td>
                  </m.tr>
                ))}
              </m.tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

interface TestimonialDetailDialogProps {
  testimonial: CoachingTestimonial | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] text-foreground whitespace-pre-wrap break-words">
        {value}
      </dd>
    </div>
  );
}

function TestimonialDetailDialog({ testimonial, onClose }: TestimonialDetailDialogProps) {
  const open = testimonial !== null;

  return (
    <DetailDialogShell open={open} onClose={onClose}>
      {testimonial ? (
        <dl className="space-y-4">
          <DetailRow label="Name" value={testimonial.name} />
          <DetailRow label="Role" value={testimonial.role} />
          <DetailRow label="Rating" value={<RatingStars rating={testimonial.rating} />} />
          <DetailRow label="Pengalaman" value={testimonial.experience} />
          {testimonial.outcome ? (
            <DetailRow label="Outcome" value={testimonial.outcome} />
          ) : null}
          <DetailRow
            label="Izin tampil publik"
            value={testimonial.agreedToPublish ? 'Yes' : 'No'}
          />
          <DetailRow
            label="Submitted"
            value={new Date(testimonial.createdAt).toLocaleString()}
          />
        </dl>
      ) : null}
    </DetailDialogShell>
  );
}

/** Lightweight native <dialog> shell for read-only detail. */
function DetailDialogShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [dialogEl, setDialogEl] = useState<HTMLDialogElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelMotion = shouldReduceMotion ? panelVariantsReduced : panelVariants;

  function closeDialog() {
    if (dialogEl?.open) dialogEl.close();
  }

  useEffect(() => {
    if (!dialogEl) return;
    if (open) {
      if (!dialogEl.open) dialogEl.showModal();
    }
  }, [open, dialogEl]);

  return (
    <dialog
      ref={setDialogEl}
      aria-label="Testimonial detail"
      className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-transparent p-0 backdrop:bg-transparent"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <AnimatePresence onExitComplete={closeDialog}>
        {open ? (
          <m.div key="detail-root" className="fixed inset-0 flex items-center justify-center p-4">
            <m.div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            />
            <m.div
              className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl theme-transition"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={panelMotion}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-balance text-lg font-semibold tracking-tight text-foreground">Testimonial</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-10 items-center rounded-full px-4 py-2 text-[14px] font-medium text-muted hover:bg-surface hover:text-foreground active:scale-[0.96] transition-transform theme-transition"
                >
                  Close
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
