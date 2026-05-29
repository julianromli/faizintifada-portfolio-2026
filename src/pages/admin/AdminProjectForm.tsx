import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import type { Project } from '../../types/project';
import { apiUrl } from '../../lib/api';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import {
  adminAlertError,
  adminBackLink,
  adminBtnPrimary,
  adminBtnSecondary,
  adminDropzoneClass,
  adminImageThumb,
  adminInputClass,
  adminLabelClass,
  adminPreviewEmpty,
  adminPreviewFrame,
  adminTextError,
  adminTextWarning,
} from '../../lib/admin-styles';
import {
  normalizeBgClassPreset,
  PROJECT_BG_PRESET_KEYS,
  PROJECT_BG_PRESETS,
  resolveProjectBgClass,
} from '../../lib/project-bg-presets';
import { ProjectImageDropzone } from '../../uploadthing/client';

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
    bgClass: 'bg-surface-neutral',
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
    bgClass: normalizeBgClassPreset(p.bgClass),
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

function isProbablyHttpImageUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function CoverPreview({ url, imagePosition }: { url: string; imagePosition: string }) {
  const [broken, setBroken] = useState(false);

  return broken ? (
    <div className={`${adminPreviewEmpty} min-h-[160px]`}>
      <p className="text-[13px] text-muted">
        Preview unavailable. Check that the URL is a direct image link.
      </p>
    </div>
  ) : (
    <div className={adminPreviewFrame}>
      <img
        src={url}
        alt="Cover preview"
        className={`mx-auto max-h-64 w-full max-w-xl object-contain ${imagePosition}`}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function GalleryThumb({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className={`${adminPreviewEmpty} aspect-square flex-col p-2`}>
        <span className="text-[11px] leading-snug text-muted">Could not load preview</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`aspect-square h-24 w-full ${adminImageThumb}`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export function AdminProjectForm() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  return <AdminProjectFormInner key={urlSlug ?? 'new'} urlSlug={urlSlug} />;
}

function AdminProjectFormInner({ urlSlug }: { urlSlug: string | undefined }) {
  const navigate = useNavigate();
  const isEdit = urlSlug !== undefined;

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);

  const coverTrimmed = form.image.trim();
  const galleryUrls = form.imagesRaw
    .split('\n')
    .flatMap((s) => {
      const trimmed = s.trim();
      return trimmed && isProbablyHttpImageUrl(trimmed) ? [trimmed] : [];
    });

  useEffect(() => {
    if (!isEdit || !urlSlug) {
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
      .flatMap((s) => {
        const trimmed = s.trim();
        return trimmed ? [trimmed] : [];
      });
    const images = form.imagesRaw
      .split('\n')
      .flatMap((s) => {
        const trimmed = s.trim();
        return trimmed ? [trimmed] : [];
      });

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
        <p className="text-[15px] text-muted animate-pulse">Loading project…</p>
      </main>
    );
  }

  if (loadError && isEdit) {
    return (
      <main className="py-12 space-y-4">
        <p className="text-alert-error">{loadError}</p>
        <Link to="/admin/projects" className="text-[15px] font-medium text-foreground underline">
          Back to list
        </Link>
      </main>
    );
  }

  return (
    <main className="pb-16 space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/projects" className={adminBackLink}>
          <ArrowLeft size={18} />
          Projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isEdit ? 'Edit project' : 'New project'}
        </h1>
        <p className="text-[15px] text-muted mt-1">
          Slugs use lowercase letters, numbers, and hyphens. Changing a slug updates the public project URL.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {saveError && <div className={adminAlertError}>{saveError}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={isEdit ? 'sm:col-span-2' : ''}>
            <label htmlFor="slug" className={adminLabelClass}>
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              aria-label="Slug"
              required
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              className={adminInputClass}
              placeholder="fintrack-dashboard"
            />
            {isEdit && (
              <p className={`mt-2 ${adminTextWarning}`}>
                Changing this will move the project to a new URL and the old slug will no longer resolve.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="title" className={adminLabelClass}>
              Title
            </label>
            <input
              id="title"
              name="title"
              aria-label="Title"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={adminLabelClass}>
              Short description
            </label>
            <textarea
              id="description"
              name="description"
              aria-label="Short description"
              required
              rows={2}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="longDescription" className={adminLabelClass}>
              Long description
            </label>
            <textarea
              id="longDescription"
              name="longDescription"
              aria-label="Long description"
              required
              rows={8}
              value={form.longDescription}
              onChange={(e) => update('longDescription', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="image" className={adminLabelClass}>
              Cover image URL
            </label>
            <input
              id="image"
              name="image"
              aria-label="Cover image URL"
              required
              value={form.image}
              onChange={(e) => update('image', e.target.value)}
              className={adminInputClass}
            />
            <p className="text-[13px] text-muted">
              Or drag and drop an image (uses UploadThing; requires being signed in to admin with a valid
              CMS token).
            </p>
            <ProjectImageDropzone
              endpoint="projectCover"
              headers={cmsUploadThingHeaders}
              aria-label="Upload cover image"
              onClientUploadComplete={(res) => {
                const u = res[0]?.url;
                if (typeof u === 'string') {
                  update('image', u);
                }
                setCoverUploadError(null);
              }}
              onUploadError={(err) => setCoverUploadError(err.message)}
              className={adminDropzoneClass}
            />
            {coverUploadError && <p className={adminTextError}>{coverUploadError}</p>}
            {isProbablyHttpImageUrl(coverTrimmed) ? (
              <div className="pt-2">
                <p className={`${adminLabelClass} text-muted`}>Preview</p>
                <CoverPreview
                  key={coverTrimmed}
                  url={coverTrimmed}
                  imagePosition={form.imagePosition.trim() || 'object-top'}
                />
              </div>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tagsRaw" className={adminLabelClass}>
              Tags (comma-separated)
            </label>
            <input
              id="tagsRaw"
              name="tagsRaw"
              aria-label="Tags (comma-separated)"
              value={form.tagsRaw}
              onChange={(e) => update('tagsRaw', e.target.value)}
              className={adminInputClass}
              placeholder="Web Design, UI/UX"
            />
          </div>

          <div>
            <label htmlFor="bgClass" className={adminLabelClass}>
              Cover background
            </label>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className={`size-10 shrink-0 rounded-lg border border-border ${resolveProjectBgClass(form.bgClass)}`}
              />
              <select
                id="bgClass"
                name="bgClass"
                aria-label="Cover background preset"
                required
                value={form.bgClass}
                onChange={(e) => update('bgClass', e.target.value)}
                className={adminInputClass}
              >
                {PROJECT_BG_PRESET_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PROJECT_BG_PRESETS[key].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="imagePosition" className={adminLabelClass}>
              Image position (optional)
            </label>
            <input
              id="imagePosition"
              name="imagePosition"
              aria-label="Image position (optional)"
              value={form.imagePosition}
              onChange={(e) => update('imagePosition', e.target.value)}
              className={adminInputClass}
              placeholder="object-top"
            />
          </div>

          <div>
            <label htmlFor="client" className={adminLabelClass}>
              Client
            </label>
            <input
              id="client"
              name="client"
              aria-label="Client"
              value={form.client}
              onChange={(e) => update('client', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div>
            <label htmlFor="role" className={adminLabelClass}>
              Role
            </label>
            <input
              id="role"
              name="role"
              aria-label="Role"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div>
            <label htmlFor="timeline" className={adminLabelClass}>
              Timeline
            </label>
            <input
              id="timeline"
              name="timeline"
              aria-label="Timeline"
              value={form.timeline}
              onChange={(e) => update('timeline', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div>
            <label htmlFor="liveUrl" className={adminLabelClass}>
              Live URL (optional)
            </label>
            <input
              id="liveUrl"
              name="liveUrl"
              type="text"
              aria-label="Live URL (optional)"
              value={form.liveUrl}
              onChange={(e) => update('liveUrl', e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="imagesRaw" className={adminLabelClass}>
              Gallery image URLs (one per line)
            </label>
            <textarea
              id="imagesRaw"
              name="imagesRaw"
              aria-label="Gallery image URLs (one per line)"
              rows={4}
              value={form.imagesRaw}
              onChange={(e) => update('imagesRaw', e.target.value)}
              className={adminInputClass}
            />
            <p className="text-[13px] text-muted">
              Or drop multiple images here to append their URLs to the list (duplicates skipped).
            </p>
            <ProjectImageDropzone
              endpoint="projectGallery"
              headers={cmsUploadThingHeaders}
              aria-label="Upload gallery images"
              onClientUploadComplete={(res) => {
                const urls = res.flatMap((r) => (typeof r.url === 'string' ? [r.url] : []));
                setForm((prev) => {
                  const existing = prev.imagesRaw
                    .split('\n')
                    .flatMap((s) => {
                      const trimmed = s.trim();
                      return trimmed ? [trimmed] : [];
                    });
                  const seen = new Set(existing);
                  for (const u of urls) {
                    seen.add(u);
                  }
                  return { ...prev, imagesRaw: Array.from(seen).join('\n') };
                });
                setGalleryUploadError(null);
              }}
              onUploadError={(err) => setGalleryUploadError(err.message)}
              className={adminDropzoneClass}
            />
            {galleryUploadError && <p className={adminTextError}>{galleryUploadError}</p>}
            {galleryUrls.length > 0 ? (
              <div className="pt-2">
                <p className={`${adminLabelClass} text-muted`}>Preview ({galleryUrls.length})</p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {galleryUrls.map((u) => (
                    <li key={u} className="min-w-0">
                      <GalleryThumb key={u} url={u} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              aria-label="Featured on homepage"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="featured" className="text-[15px] text-foreground">
              Featured on homepage
            </label>
          </div>

          <div>
            <label htmlFor="sortOrder" className={adminLabelClass}>
              Sort order
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              aria-label="Sort order"
              min={0}
              value={form.sortOrder}
              onChange={(e) => update('sortOrder', e.target.value)}
              className={adminInputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className={adminBtnPrimary}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </button>
          <Link to="/admin/projects" className={adminBtnSecondary}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
