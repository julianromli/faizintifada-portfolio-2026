import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useProjects } from '../../hooks/useProjects';
import { adminFetch, clearAdminToken, readAdminError } from '../../lib/admin-api';

interface PendingDelete {
  slug: string;
  title: string;
}

export function AdminProjectList() {
  const navigate = useNavigate();
  const { projects, loading, error, retry } = useProjects();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [hiddenSlugs, setHiddenSlugs] = useState<Set<string>>(() => new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  function logout() {
    clearAdminToken();
    navigate('/admin', { replace: true });
  }

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
              <span className="font-medium text-gray-900">{pendingDelete.title}</span>
              <span className="block mt-1 font-mono text-[13px] text-gray-500">{pendingDelete.slug}</span>
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

    <main className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Projects</h1>
          <p className="text-[15px] text-gray-500 mt-1">
            Create, edit, or remove case studies. Public site reads from the same database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-gray-800"
          >
            <Plus size={18} weight="bold" aria-hidden />
            New project
          </Link>
          <Link
            to="/admin/page"
            className="rounded-full border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50"
          >
            Page settings
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
          <Link
            to="/"
            className="rounded-full px-5 py-2.5 text-[14px] font-medium text-gray-600 hover:text-gray-900 self-center"
          >
            View site
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-[14px] text-green-900">
          {actionSuccess}
        </div>
      )}

      {loading && (
        <p className="text-[15px] text-gray-500 animate-pulse">Loading projects…</p>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[14px] text-amber-900 space-y-2">
          <p>{error.message}</p>
          <button type="button" onClick={() => retry()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && visibleProjects.length === 0 && (
        <p className="text-[15px] text-gray-500">No projects yet. Create one to get started.</p>
      )}

      {!loading && !error && visibleProjects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Featured</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleProjects.map((p) => (
                <tr key={p.slug} className="bg-white">
                  <td className="px-4 py-3 font-mono text-[13px] text-gray-800">{p.slug}</td>
                  <td className="px-4 py-3 text-gray-900">{p.title}</td>
                  <td className="px-4 py-3 text-gray-600">{p.featured ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sortOrder ?? 0}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/projects/edit/${encodeURIComponent(p.slug)}`}
                      className="inline-flex items-center gap-1 pr-4 text-gray-700 hover:text-gray-900 font-medium"
                    >
                      <PencilSimple size={18} aria-hidden />
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={busySlug === p.slug}
                      onClick={() => requestDelete({ slug: p.slug, title: p.title })}
                      className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-medium disabled:opacity-50"
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
