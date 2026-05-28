import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../../lib/page-settings';
import { ProjectImageDropzone } from '../../uploadthing/client';
import type { Testimonial } from '../../types/testimonial';
import { AdminTestimonialsSection } from './AdminTestimonialsSection';

type ImageKey = keyof PageSettings;

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10';
const labelClass = 'block text-[13px] font-medium text-gray-700 mb-1.5';

const imageFields: Array<{
  key: ImageKey;
  label: string;
  description: string;
  previewClassName: string;
}> = [
  {
    key: 'avatarImage',
    label: 'Avatar image',
    description: 'Small square portrait beside your name.',
    previewClassName: 'aspect-square max-h-32 rounded-2xl object-cover',
  },
  {
    key: 'heroImageTop',
    label: 'Hero image 1',
    description: 'Top image in the right hero column.',
    previewClassName: 'aspect-[1.91/1] rounded-2xl object-cover',
  },
  {
    key: 'heroImageMiddle',
    label: 'Hero image 2',
    description: 'Middle image in the right hero column.',
    previewClassName: 'aspect-[1.91/1] rounded-2xl object-cover',
  },
  {
    key: 'heroImageBottom',
    label: 'Hero image 3',
    description: 'Bottom image in the right hero column.',
    previewClassName: 'aspect-[1.91/1] rounded-2xl object-cover',
  },
];

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
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
        <p className="text-[13px] text-gray-500">Enter or upload an image URL to preview it.</p>
      </div>
    );
  }

  if (broken) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
        <p className="text-[13px] text-gray-500">Preview unavailable. Check that this is a direct image link.</p>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`w-full border border-gray-100 bg-gray-50 ${className}`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export function AdminPageSettings() {
  const [form, setForm] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<ImageKey, string>>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [settingsRes, testimonialsRes] = await Promise.all([
          adminFetch('/api/admin/page-settings'),
          adminFetch('/api/admin/testimonials'),
        ]);

        if (!cancelled) {
          if (settingsRes.ok) {
            const settings = (await settingsRes.json()) as PageSettings;
            setForm(settings);
          } else {
            const msg = await readAdminError(settingsRes);
            throw new Error(msg);
          }

          if (testimonialsRes.ok) {
            const items = (await testimonialsRes.json()) as Testimonial[];
            setTestimonials(items);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
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
  }, []);

  function update(key: ImageKey, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);

    const payload: PageSettings = {
      avatarImage: form.avatarImage.trim(),
      heroImageTop: form.heroImageTop.trim(),
      heroImageMiddle: form.heroImageMiddle.trim(),
      heroImageBottom: form.heroImageBottom.trim(),
    };

    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/page-settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await readAdminError(res);
        throw new Error(msg);
      }
      const settings = (await res.json()) as PageSettings;
      setForm(settings);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="py-12">
        <p className="text-[15px] text-gray-500 animate-pulse">Loading page settings…</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl space-y-8 pb-16">
      <div>
        <Link
          to="/admin/projects"
          className="mb-6 inline-flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Page settings</h1>
        <p className="mt-1 text-[15px] text-gray-500">
          Manage the homepage hero avatar, image stack, and testimonial carousel. Uploads use the same CMS token as
          project images.
        </p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          {loadError}. Showing defaults until the API can be reached.
        </div>
      )}

      {saveError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {saveError}
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
          Page settings saved. Refresh the homepage to verify the new images.
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {imageFields.map((field) => (
          <section key={field.key} className="rounded-3xl border border-gray-100 p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-3">
                <div>
                  <label htmlFor={field.key} className={labelClass}>
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    name={field.key}
                    aria-label={field.label}
                    required
                    value={form[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                  />
                  <p className="mt-2 text-[13px] text-gray-500">{field.description}</p>
                </div>

                <ProjectImageDropzone
                  endpoint="pageImage"
                  headers={cmsUploadThingHeaders}
                  aria-label={`Upload ${field.label}`}
                  onClientUploadComplete={(res) => {
                    const url = res[0]?.url;
                    if (typeof url === 'string') {
                      update(field.key, url);
                    }
                    setUploadErrors((current) => ({ ...current, [field.key]: undefined }));
                  }}
                  onUploadError={(err) => {
                    setUploadErrors((current) => ({ ...current, [field.key]: err.message }));
                  }}
                  className="rounded-2xl border border-gray-100 bg-gray-50/50"
                />
                {uploadErrors[field.key] && (
                  <p className="text-[13px] text-red-600">{uploadErrors[field.key]}</p>
                )}
              </div>

              <div>
                <p className={`${labelClass} text-gray-600`}>Preview</p>
                <ImagePreview key={form[field.key]} url={form[field.key]} className={field.previewClassName} />
              </div>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-6 py-3 text-[15px] font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save page settings'}
          </button>
          <Link
            to="/"
            className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-[15px] font-medium text-gray-700 hover:bg-gray-50"
          >
            View site
          </Link>
        </div>
      </form>

      <AdminTestimonialsSection testimonials={testimonials} onChange={setTestimonials} />
    </main>
  );
}
