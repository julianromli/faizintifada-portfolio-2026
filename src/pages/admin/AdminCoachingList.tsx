import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash } from '@phosphor-icons/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  fetchCoachingSubmissions,
  deleteCoachingSubmission,
} from '../../lib/coaching-admin-api';
import { clearAdminToken } from '../../lib/admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminBtnDestructive,
  adminBtnSecondarySm,
  adminLinkGhost,
  adminTableContainer,
  adminTableDivide,
  adminTableHead,
  adminTableRow,
} from '../../lib/admin-styles';
import {
  coachingExperienceLabel,
  coachingIdeLabel,
  coachingOsLabel,
} from '../../lib/coaching-options';
import type { CoachingSubmission } from '../../types/coaching';

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function ideDisplay(s: CoachingSubmission): string {
  if (s.ide === 'other') {
    return s.ideOther ? `${coachingIdeLabel(s.ide)} (${s.ideOther})` : coachingIdeLabel(s.ide);
  }
  return coachingIdeLabel(s.ide);
}

export function AdminCoachingList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CoachingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CoachingSubmission | null>(null);
  const [detail, setDetail] = useState<CoachingSubmission | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCoachingSubmissions();
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

  function logout() {
    clearAdminToken();
    navigate('/admin', { replace: true });
  }

  function requestDelete(item: CoachingSubmission) {
    setActionError(null);
    setActionSuccess(null);
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setBusyId(id);
    try {
      await deleteCoachingSubmission(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setActionSuccess(`Deleted submission from “${pendingDelete.name}”.`);
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
        title="Delete submission?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium text-foreground">{pendingDelete.name}</span>
              <span className="block mt-1 font-mono text-[13px] text-muted">
                {pendingDelete.email}
              </span>
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

      <CoachingDetailDialog
        submission={detail}
        onClose={() => setDetail(null)}
        ideDisplay={ideDisplay}
      />

      <main className="space-y-8 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coaching</h1>
            <p className="text-[15px] text-muted mt-1">
              Booking submissions from the public coaching page. Newest first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/projects" className={adminBtnSecondarySm}>
              Projects
            </Link>
            <Link to="/admin/page" className={adminBtnSecondarySm}>
              Page settings
            </Link>
            <button type="button" onClick={logout} className={adminBtnSecondarySm}>
              Sign out
            </button>
            <Link to="/" className={adminLinkGhost}>
              View site
            </Link>
          </div>
        </div>

        {actionError && <div className={adminAlertError}>{actionError}</div>}
        {actionSuccess && <div className={adminAlertSuccess}>{actionSuccess}</div>}

        {loading && (
          <p className="text-[15px] text-muted animate-pulse">Loading submissions…</p>
        )}

        {!loading && error && (
          <div className="alert alert-warning space-y-2">
            <p>{error}</p>
            <button type="button" onClick={() => void load()} className="underline font-medium">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-[15px] text-muted">No submissions yet.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className={adminTableContainer}>
            <table className="w-full text-left text-[14px]">
              <thead className={adminTableHead}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Experience</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${adminTableDivide}`}>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    className={`${adminTableRow} cursor-pointer hover:bg-surface theme-transition`}
                    onClick={() => setDetail(s)}
                  >
                    <td className="px-4 py-3 text-foreground">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted">{s.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {coachingExperienceLabel(s.experience)}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(s);
                        }}
                        className={adminBtnDestructive}
                      >
                        <Trash size={18} aria-hidden />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

interface CoachingDetailDialogProps {
  submission: CoachingSubmission | null;
  onClose: () => void;
  ideDisplay: (s: CoachingSubmission) => string;
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

function CoachingDetailDialog({ submission, onClose, ideDisplay }: CoachingDetailDialogProps) {
  const open = submission !== null;

  return (
    <ConfirmDialogShell open={open} onClose={onClose}>
      {submission ? (
        <dl className="space-y-4">
          <DetailRow label="Name" value={submission.name} />
          <DetailRow label="Email" value={submission.email} />
          {submission.contact ? (
            <DetailRow label="WhatsApp / Telegram" value={submission.contact} />
          ) : null}
          <DetailRow label="OS" value={coachingOsLabel(submission.os)} />
          <DetailRow label="IDE" value={ideDisplay(submission)} />
          <DetailRow
            label="Experience"
            value={coachingExperienceLabel(submission.experience)}
          />
          <DetailRow label="Tentang dia" value={submission.about} />
          <DetailRow label="Mau build apa" value={submission.goal} />
          {submission.repoUrl ? <DetailRow label="Repo" value={submission.repoUrl} /> : null}
          <DetailRow label="Setuju ketentuan" value={submission.agreedToTerms ? 'Yes' : 'No'} />
          <DetailRow
            label="Submitted"
            value={new Date(submission.createdAt).toLocaleString()}
          />
        </dl>
      ) : null}
    </ConfirmDialogShell>
  );
}

/** Lightweight native <dialog> shell for read-only detail. */
function ConfirmDialogShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useState<HTMLDialogElement | null>(null);
  const [dialogEl, setDialogEl] = ref;

  useEffect(() => {
    if (!dialogEl) return;
    if (open) {
      if (!dialogEl.open) dialogEl.showModal();
    } else if (dialogEl.open) {
      dialogEl.close();
    }
  }, [open, dialogEl]);

  return (
    <dialog
      ref={setDialogEl}
      aria-label="Submission detail"
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-3xl border border-border bg-card p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col theme-transition"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Submission</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-[14px] font-medium text-muted hover:bg-surface hover:text-foreground theme-transition"
        >
          Close
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
    </dialog>
  );
}
