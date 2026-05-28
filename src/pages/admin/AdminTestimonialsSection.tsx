import { useCallback, useState, type FormEvent } from 'react';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import type { Testimonial } from '../../types/testimonial';
import { ProjectImageDropzone } from '../../uploadthing/client';

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10';
const labelClass = 'block text-[13px] font-medium text-gray-700 mb-1.5';

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
      <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-2 text-center">
        <p className="text-[12px] text-gray-500">Upload or paste URL</p>
      </div>
    );
  }

  if (broken) {
    return (
      <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-2 text-center">
        <p className="text-[12px] text-gray-500">Preview unavailable</p>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`size-20 border border-gray-100 bg-gray-50 object-cover ${className}`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

type EditingState = { mode: 'new' } | { mode: 'edit'; id: number };

type Props = {
  testimonials: Testimonial[];
  onChange: (items: Testimonial[]) => void;
};

export function AdminTestimonialsSection({ testimonials, onChange }: Props) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const sorted = [...testimonials].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccessMessage(null);
  }

  function startNew() {
    setEditing({ mode: 'new' });
    setForm(emptyForm());
    setSaveError(null);
    setSuccessMessage(null);
    setAvatarUploadError(null);
  }

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

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete testimonial from ${name}?`)) {
      return;
    }

    setSaveError(null);
    setSuccessMessage(null);

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
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Hero testimonials</h2>
          <p className="mt-1 text-[15px] text-gray-500">
            Carousel quotes on the homepage hero. Lower sort order appears first.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-[14px] font-medium text-gray-800 hover:bg-gray-50"
        >
          <Plus size={18} />
          Add testimonial
        </button>
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {saveError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
          {successMessage}
        </div>
      )}

      {editing && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 rounded-3xl border border-gray-100 p-5 sm:p-6"
        >
          <h3 className="text-[15px] font-semibold text-gray-900">
            {editing.mode === 'new' ? 'New testimonial' : 'Edit testimonial'}
          </h3>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-3">
              <div>
                <label htmlFor="testimonial-avatar" className={labelClass}>
                  Avatar
                </label>
                <input
                  id="testimonial-avatar"
                  name="avatar"
                  required
                  value={form.avatar}
                  onChange={(e) => update('avatar', e.target.value)}
                  className={inputClass}
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
                className="rounded-2xl border border-gray-100 bg-gray-50/50"
              />
              {avatarUploadError && (
                <p className="text-[13px] text-red-600">{avatarUploadError}</p>
              )}
            </div>
            <ImagePreview url={form.avatar} className="rounded-xl" />
          </div>

          <div>
            <label htmlFor="testimonial-name" className={labelClass}>
              Name
            </label>
            <input
              id="testimonial-name"
              name="name"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="testimonial-role" className={labelClass}>
              Role
            </label>
            <input
              id="testimonial-role"
              name="role"
              required
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={inputClass}
              placeholder="CEO of Nova Tech"
            />
          </div>

          <div>
            <label htmlFor="testimonial-quote" className={labelClass}>
              Testimonial
            </label>
            <textarea
              id="testimonial-quote"
              name="quote"
              required
              rows={4}
              value={form.quote}
              onChange={(e) => update('quote', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="testimonial-sortOrder" className={labelClass}>
              Sort order
            </label>
            <input
              id="testimonial-sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => update('sortOrder', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing.mode === 'new' ? 'Create' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-[15px] text-gray-500">No testimonials yet. Add one to show the hero carousel.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 p-4"
            >
              <img
                src={t.avatar}
                alt=""
                className="size-12 shrink-0 rounded-xl border border-gray-100 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-gray-900">{t.name}</p>
                <p className="truncate text-[13px] text-gray-500">{t.role}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-1 text-[12px] text-gray-400">Sort: {t.sortOrder}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PencilSimple size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t.id, t.name)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3 py-2 text-[13px] font-medium text-red-700 hover:bg-red-50"
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
  );
}
