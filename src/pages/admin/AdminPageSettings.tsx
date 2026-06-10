import { useEffect, useState, type FormEvent } from 'react';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminAlertWarning,
  adminBtnPrimary,
  adminDropzoneClass,
  adminInputClass,
  adminLabelClass,
  adminPreviewEmpty,
  adminSectionCard,
  adminTextError,
} from '../../lib/admin-styles';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../../lib/page-settings';
import { ProjectImageDropzone } from '../../uploadthing/client';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

type ImageKey = keyof PageSettings;

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
      <div className={`${adminPreviewEmpty} min-h-32`}>
        <p className="text-[13px] text-muted">Enter or upload an image URL to preview it.</p>
      </div>
    );
  }

  if (broken) {
    return (
      <div className={`${adminPreviewEmpty} min-h-32`}>
        <p className="text-[13px] text-muted">Preview unavailable. Check that this is a direct image link.</p>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`w-full border border-border bg-surface ${className}`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export function AdminPageSettings() {
  const [form, setForm] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);
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
        const settingsRes = await adminFetch('/api/admin/page-settings');

        if (!cancelled) {
          if (settingsRes.ok) {
            const settings = (await settingsRes.json()) as PageSettings;
            setForm(settings);
          } else {
            const msg = await readAdminError(settingsRes);
            throw new Error(msg);
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
    return <p className="text-[15px] text-muted animate-pulse">Loading page settings…</p>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Page settings"
        description="Manage the homepage hero avatar and image stack. Uploads use the same CMS token as project images."
      />

      {loadError && <div className={adminAlertWarning}>{loadError}. Showing defaults until the API can be reached.</div>}

      {saveError && <div className={adminAlertError}>{saveError}</div>}

      {saved && (
        <div className={adminAlertSuccess}>
          Page settings saved. Refresh the homepage to verify the new images.
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {imageFields.map((field) => (
          <section key={field.key} className={adminSectionCard}>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-3">
                <div>
                  <label htmlFor={field.key} className={adminLabelClass}>
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    name={field.key}
                    aria-label={field.label}
                    required
                    value={form[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                    className={adminInputClass}
                    placeholder="https://..."
                  />
                  <p className="mt-2 text-[13px] text-muted">{field.description}</p>
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
                  className={adminDropzoneClass}
                />
                {uploadErrors[field.key] && <p className={adminTextError}>{uploadErrors[field.key]}</p>}
              </div>

              <div>
                <p className={`${adminLabelClass} text-muted`}>Preview</p>
                <ImagePreview key={form[field.key]} url={form[field.key]} className={field.previewClassName} />
              </div>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className={adminBtnPrimary}>
            {saving ? 'Saving…' : 'Save page settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
