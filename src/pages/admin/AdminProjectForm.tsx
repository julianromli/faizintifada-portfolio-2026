import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import type { Project } from '../../types/project';
import { apiUrl } from '../../lib/api';
import { adminFetch, readAdminError } from '../../lib/admin-api';

type FormState = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tagsRaw: string;
  bgClass: string;
  imagePosition: string;
  client: string;
  role: string;
  timeline: string;
  liveUrl: string;
  imagesRaw: string;
  featured: boolean;
  sortOrder: string;
};

function emptyForm(): FormState {
  return {
    slug: '',
    title: '',
    description: '',
    longDescription: '',
    image: '',
    tagsRaw: '',
    bgClass: 'bg-gray-50',
    imagePosition: 'object-top',
    client: '',
    role: '',
    timeline: '',
    liveUrl: '',
    imagesRaw: '',
    featured: true,
    sortOrder: '0',
  };
}

function projectToForm(p: Project): FormState {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    longDescription: p.longDescription,
    image: p.image,
    tagsRaw: p.tags.join(', '),
    bgClass: p.bgClass,
    imagePosition: p.imagePosition ?? '',
    client: p.client ?? '',
    role: p.role ?? '',
    timeline: p.timeline ?? '',
    liveUrl: p.liveUrl ?? '',
    imagesRaw: (p.images ?? []).join('\n'),
    featured: p.featured ?? true,
    sortOrder: String(p.sortOrder ?? 0),
  };
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10';
const labelClass = 'block text-[13px] font-medium text-gray-700 mb-1.5';

export function AdminProjectForm() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = urlSlug !== undefined;

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !urlSlug) {
      setForm(emptyForm());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(urlSlug)}`));
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Project not found' : 'Failed to load project');
        }
        const project = (await res.json()) as Project;
        if (!cancelled) {
          setForm(projectToForm(project));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, urlSlug]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const tags = form.tagsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const images = form.imagesRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    let sortNum = Number.parseInt(form.sortOrder, 10);
    if (Number.isNaN(sortNum) || sortNum < 0) {
      sortNum = 0;
    }

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      image: form.image.trim(),
      tags,
      bgClass: form.bgClass.trim(),
      imagePosition: form.imagePosition.trim() || undefined,
      client: form.client.trim() || undefined,
      role: form.role.trim() || undefined,
      timeline: form.timeline.trim() || undefined,
      liveUrl: form.liveUrl.trim() || undefined,
      images: images.length ? images : undefined,
      featured: form.featured,
      sortOrder: sortNum,
    };

    if (!payload.slug) {
      setSaveError('Slug is required.');
      return;
    }

    setSaving(true);
    try {
      const path = isEdit
        ? `/api/admin/projects/${encodeURIComponent(urlSlug!)}`
        : '/api/admin/projects';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await adminFetch(path, {
        method,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await readAdminError(res);
        throw new Error(msg);
      }
      navigate('/admin/projects', { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="py-12">
        <p className="text-[15px] text-gray-500 animate-pulse">Loading project…</p>
      </main>
    );
  }

  if (loadError && isEdit) {
    return (
      <main className="py-12 space-y-4">
        <p className="text-red-700">{loadError}</p>
        <Link to="/admin/projects" className="text-[15px] font-medium text-gray-700 underline">
          Back to list
        </Link>
      </main>
    );
  }

  return (
    <main className="pb-16 space-y-8 max-w-3xl">
      <div>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {isEdit ? 'Edit project' : 'New project'}
        </h1>
        <p className="text-[15px] text-gray-500 mt-1">
          Slugs use lowercase letters, numbers, and hyphens. Changing the slug later is disabled in edit
          mode.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {saveError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-800">
            {saveError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={isEdit ? 'sm:col-span-2' : ''}>
            <label htmlFor="slug" className={labelClass}>
              Slug
            </label>
            <input
              id="slug"
              required
              disabled={isEdit}
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              className={inputClass}
              placeholder="fintrack-dashboard"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              id="title"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Short description
            </label>
            <textarea
              id="description"
              required
              rows={2}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="longDescription" className={labelClass}>
              Long description
            </label>
            <textarea
              id="longDescription"
              required
              rows={8}
              value={form.longDescription}
              onChange={(e) => update('longDescription', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="image" className={labelClass}>
              Cover image URL
            </label>
            <input
              id="image"
              required
              value={form.image}
              onChange={(e) => update('image', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tagsRaw" className={labelClass}>
              Tags (comma-separated)
            </label>
            <input
              id="tagsRaw"
              value={form.tagsRaw}
              onChange={(e) => update('tagsRaw', e.target.value)}
              className={inputClass}
              placeholder="Web Design, UI/UX"
            />
          </div>

          <div>
            <label htmlFor="bgClass" className={labelClass}>
              Background class (Tailwind)
            </label>
            <input
              id="bgClass"
              required
              value={form.bgClass}
              onChange={(e) => update('bgClass', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="imagePosition" className={labelClass}>
              Image position (optional)
            </label>
            <input
              id="imagePosition"
              value={form.imagePosition}
              onChange={(e) => update('imagePosition', e.target.value)}
              className={inputClass}
              placeholder="object-top"
            />
          </div>

          <div>
            <label htmlFor="client" className={labelClass}>
              Client
            </label>
            <input
              id="client"
              value={form.client}
              onChange={(e) => update('client', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="role" className={labelClass}>
              Role
            </label>
            <input
              id="role"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="timeline" className={labelClass}>
              Timeline
            </label>
            <input
              id="timeline"
              value={form.timeline}
              onChange={(e) => update('timeline', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="liveUrl" className={labelClass}>
              Live URL (optional)
            </label>
            <input
              id="liveUrl"
              type="text"
              value={form.liveUrl}
              onChange={(e) => update('liveUrl', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="imagesRaw" className={labelClass}>
              Gallery image URLs (one per line)
            </label>
            <textarea
              id="imagesRaw"
              rows={4}
              value={form.imagesRaw}
              onChange={(e) => update('imagesRaw', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="featured"
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="featured" className="text-[15px] text-gray-800">
              Featured on homepage
            </label>
          </div>

          <div>
            <label htmlFor="sortOrder" className={labelClass}>
              Sort order
            </label>
            <input
              id="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => update('sortOrder', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-6 py-3 text-[15px] font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </button>
          <Link
            to="/admin/projects"
            className="rounded-full border border-gray-200 px-6 py-3 text-[15px] font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
