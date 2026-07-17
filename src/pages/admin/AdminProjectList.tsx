import { useState } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItemOpacity } from '../../lib/motion';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useProjects } from '../../hooks/useProjects';
import {
  adminAlertError,
  adminAlertSuccess,
  adminAlertWarning,
  adminBtnDestructive,
  adminTableContainer,
  adminTableDivide,
  adminTableHead,
  adminTableRow,
} from '../../lib/admin-styles';
import { adminFetch, readAdminError } from '../../lib/admin-api';

interface PendingDelete {
  slug: string;
  title: string;
}

export function AdminProjectList() {
  const { projects, loading, error, retry } = useProjects();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [hiddenSlugs, setHiddenSlugs] = useState<Set<string>>(() => new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  function requestDelete(project: PendingDelete) {
    setActionError(null);
    setActionSuccess(null);
    setPendingDelete(project);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    const { slug } = pendingDelete;
    setBusySlug(slug);
    try {
      const res = await adminFetch(`/api/admin/projects/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await readAdminError(res);
        throw new Error(msg);
      }
      setHiddenSlugs((prev) => new Set(prev).add(slug));
      setActionSuccess(`Deleted “${slug}”.`);
      setPendingDelete(null);
      retry();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusySlug(null);
    }
  }

  const visibleProjects = projects.filter((p) => !hiddenSlugs.has(p.slug));

  return (
    <>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete project?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium text-foreground">{pendingDelete.title}</span>
              <span className="block mt-1 font-mono text-[13px] text-muted">{pendingDelete.slug}</span>
              <span className="block mt-2">This cannot be undone.</span>
            </>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        busy={pendingDelete !== null && busySlug === pendingDelete.slug}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      <div className="space-y-6">
        <AdminPageHeader
          title="Projects"
          description="Create, edit, or remove case studies. Public site reads from the same database."
          action={{
            type: 'link',
            label: 'New project',
            to: '/admin/projects/new',
            icon: <Plus size={18} weight="bold" aria-hidden />,
          }}
        />

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
          <div className={`${adminAlertWarning} space-y-2`}>
            <p>{error.message}</p>
            <button type="button" onClick={() => retry()} className="inline-flex min-h-10 items-center underline font-medium">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && visibleProjects.length === 0 && (
          <p className="text-[15px] text-muted">No projects yet. Create one to get started.</p>
        )}

        {!loading && !error && visibleProjects.length > 0 && (
          <div className={adminTableContainer}>
            <table className="w-full text-left text-[14px]">
              <thead className={adminTableHead}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Featured</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <m.tbody className={`divide-y ${adminTableDivide}`} initial="hidden" animate="show" variants={staggerContainer}>
                {visibleProjects.map((p) => (
                  <m.tr key={p.slug} className={adminTableRow} variants={staggerItemOpacity}>
                    <td className="px-4 py-3 font-mono text-[13px] text-foreground">{p.slug}</td>
                    <td className="px-4 py-3 text-foreground">{p.title}</td>
                    <td className="px-4 py-3 text-muted">{p.featured ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{p.sortOrder ?? 0}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/projects/edit/${encodeURIComponent(p.slug)}`}
                        className="inline-flex min-h-10 items-center gap-1 pr-4 text-foreground hover:text-foreground/80 font-medium theme-transition"
                      >
                        <PencilSimple size={18} aria-hidden />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busySlug === p.slug}
                        onClick={() => requestDelete({ slug: p.slug, title: p.title })}
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
