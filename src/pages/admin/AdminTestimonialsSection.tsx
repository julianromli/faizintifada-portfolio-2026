import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  type FormEvent,
} from 'react';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminBtnDestructiveOutline,
  adminBtnPrimarySm,
  adminBtnSecondarySm,
  adminBtnSecondaryXs,
  adminDropzoneClass,
  adminImageThumb,
  adminInputClass,
  adminLabelClass,
  adminListItem,
  adminPreviewEmpty,
  adminSectionCard,
  adminTextError,
} from '../../lib/admin-styles';
import type { Testimonial } from '../../types/testimonial';
import { ProjectImageDropzone } from '../../uploadthing/client';

type FormState = {
  avatar: string;
  name: string;
  role: string;
  quote: string;
  sortOrder: string;
};

function emptyForm(): FormState {
  return {
    avatar: '',
    name: '',
    role: '',
    quote: '',
    sortOrder: '0',
  };
}

function testimonialToForm(t: Testimonial): FormState {
  return {
    avatar: t.avatar,
    name: t.name,
    role: t.role,
    quote: t.quote,
    sortOrder: String(t.sortOrder),
  };
}

function isProbablyHttpImageUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function ImagePreview({ url, className }: { url: string; className: string }) {
  const [broken, setBroken] = useState(false);

  if (!isProbablyHttpImageUrl(url)) {
    return (
      <div className={`${adminPreviewEmpty} size-20 px-2`}>
        <p className="text-[12px] text-muted">Upload or paste URL</p>
      </div>
    );
  }

  if (broken) {
    return (
      <div className={`${adminPreviewEmpty} size-20 px-2`}>
        <p className="text-[12px] text-muted">Preview unavailable</p>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`size-20 bg-surface object-cover ${adminImageThumb} ${className}`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

type EditingState = { mode: 'new' } | { mode: 'edit'; id: number };

type Props = {
  testimonials: Testimonial[];
  onChange: (items: Testimonial[]) => void;
  hideHeader?: boolean;
};

export type AdminTestimonialsSectionHandle = {
  startNew: () => void;
};

export const AdminTestimonialsSection = forwardRef<AdminTestimonialsSectionHandle, Props>(
  function AdminTestimonialsSection({ testimonials, onChange, hideHeader = false }, ref) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = [...testimonials].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccessMessage(null);
  }

  const startNew = useCallback(() => {
    setEditing({ mode: 'new' });
    setForm(emptyForm());
    setSaveError(null);
    setSuccessMessage(null);
    setAvatarUploadError(null);
  }, []);

  useImperativeHandle(ref, () => ({ startNew }), [startNew]);

  function startEdit(t: Testimonial) {
    setEditing({ mode: 'edit', id: t.id });
    setForm(testimonialToForm(t));
    setSaveError(null);
    setSuccessMessage(null);
    setAvatarUploadError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm());
    setSaveError(null);
    setAvatarUploadError(null);
  }

  const reloadList = useCallback(async () => {
    const res = await adminFetch('/api/admin/testimonials');
    if (!res.ok) {
      const msg = await readAdminError(res);
      throw new Error(msg);
    }
    const items = (await res.json()) as Testimonial[];
    onChange(items);
    return items;
  }, [onChange]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    let sortNum = Number.parseInt(form.sortOrder, 10);
    if (Number.isNaN(sortNum) || sortNum < 0) {
      sortNum = 0;
    }

    const payload = {
      avatar: form.avatar.trim(),
      name: form.name.trim(),
      role: form.role.trim(),
      quote: form.quote.trim(),
      sortOrder: sortNum,
    };

    if (!payload.avatar || !payload.name || !payload.role || !payload.quote) {
      setSaveError('Avatar, name, role, and testimonial text are required.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = editing?.mode === 'edit';
      const res = await adminFetch(
        isEdit ? `/api/admin/testimonials/${editing.id}` : '/api/admin/testimonials',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const msg = await readAdminError(res);
        throw new Error(msg);
      }

      await reloadList();
      setSuccessMessage(isEdit ? 'Testimonial updated.' : 'Testimonial created.');
      setEditing(null);
      setForm(emptyForm());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(id: number, name: string) {
    setSaveError(null);
    setSuccessMessage(null);
    setPendingDelete({ id, name });
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    const { id } = pendingDelete;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await readAdminError(res);
        throw new Error(msg);
      }

      onChange(testimonials.filter((t) => t.id !== id));
      if (editing?.mode === 'edit' && editing.id === id) {
        cancelEdit();
      }
      setSuccessMessage('Testimonial deleted.');
      setPendingDelete(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
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
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

    <section className="space-y-6">
      {!hideHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Hero testimonials</h2>
            <p className="mt-1 text-[15px] text-muted">
              Carousel quotes on the homepage hero. Lower sort order appears first.
            </p>
          </div>
          <button type="button" onClick={startNew} className={adminBtnSecondarySm}>
            <Plus size={18} />
            Add testimonial
          </button>
        </div>
      ) : null}

      {saveError && <div className={adminAlertError}>{saveError}</div>}

      {successMessage && <div className={adminAlertSuccess}>{successMessage}</div>}

      {editing && (
        <form onSubmit={(e) => void handleSubmit(e)} className={`space-y-4 ${adminSectionCard}`}>
          <h3 className="text-[15px] font-semibold text-foreground">
            {editing.mode === 'new' ? 'New testimonial' : 'Edit testimonial'}
          </h3>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-3">
              <div>
                <label htmlFor="testimonial-avatar" className={adminLabelClass}>
                  Avatar
                </label>
                <input
                  id="testimonial-avatar"
                  name="avatar"
                  required
                  value={form.avatar}
                  onChange={(e) => update('avatar', e.target.value)}
                  className={adminInputClass}
                  placeholder="https://..."
                />
              </div>
              <ProjectImageDropzone
                endpoint="pageImage"
                headers={cmsUploadThingHeaders}
                aria-label="Upload testimonial avatar"
                onClientUploadComplete={(res) => {
                  const url = res[0]?.url;
                  if (typeof url === 'string') {
                    update('avatar', url);
                  }
                  setAvatarUploadError(null);
                }}
                onUploadError={(err) => setAvatarUploadError(err.message)}
                className={adminDropzoneClass}
              />
              {avatarUploadError && <p className={adminTextError}>{avatarUploadError}</p>}
            </div>
            <ImagePreview url={form.avatar} className="rounded-xl" />
          </div>

          <div>
            <label htmlFor="testimonial-name" className={adminLabelClass}>
              Name
            </label>
            <input
              id="testimonial-name"
              name="name"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div>
            <label htmlFor="testimonial-role" className={adminLabelClass}>
              Role
            </label>
            <input
              id="testimonial-role"
              name="role"
              required
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={adminInputClass}
              placeholder="CEO of Nova Tech"
            />
          </div>

          <div>
            <label htmlFor="testimonial-quote" className={adminLabelClass}>
              Testimonial
            </label>
            <textarea
              id="testimonial-quote"
              name="quote"
              required
              rows={4}
              value={form.quote}
              onChange={(e) => update('quote', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div>
            <label htmlFor="testimonial-sortOrder" className={adminLabelClass}>
              Sort order
            </label>
            <input
              id="testimonial-sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => update('sortOrder', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className={adminBtnPrimarySm}>
              {saving ? 'Saving…' : editing.mode === 'new' ? 'Create' : 'Save changes'}
            </button>
            <button type="button" onClick={cancelEdit} className={adminBtnSecondarySm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-[15px] text-muted">No testimonials yet. Add one to show the hero carousel.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((t) => (
            <li key={t.id} className={`flex flex-wrap items-center gap-4 ${adminListItem}`}>
              <img src={t.avatar} alt="" className={`size-12 shrink-0 ${adminImageThumb}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-foreground">{t.name}</p>
                <p className="truncate text-[13px] text-muted">{t.role}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-1 text-[12px] text-muted/70">Sort: {t.sortOrder}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => startEdit(t)} className={adminBtnSecondaryXs}>
                  <PencilSimple size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(t.id, t.name)}
                  className={adminBtnDestructiveOutline}
                >
                  <Trash size={16} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
    </>
  );
  },
);

AdminTestimonialsSection.displayName = 'AdminTestimonialsSection';
