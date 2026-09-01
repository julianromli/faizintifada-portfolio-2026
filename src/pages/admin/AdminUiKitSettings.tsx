import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminAlertWarning,
  adminBtnPrimary,
  adminDropzoneClass,
  adminImageThumb,
  adminInputClass,
  adminLabelClass,
  adminPreviewEmpty,
  adminPreviewFrame,
  adminSectionCard,
  adminTextError,
} from '../../lib/admin-styles';
import { DEFAULT_UI_KIT_SETTINGS, type UiKitSettings } from '../../lib/ui-kit-settings';
import { ProjectImageDropzone } from '../../uploadthing/client';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

type VideoFieldKey = 'previewVideoUrl' | 'featuresVideoUrl' | 'installVideoUrl';

const videoFields: Array<{
  key: VideoFieldKey;
  label: string;
  description: string;
}> = [
  {
    key: 'previewVideoUrl',
    label: 'Preview walkthrough video',
    description: 'Main video in the preview section at the top of /ui. Required.',
  },
  {
    key: 'featuresVideoUrl',
    label: 'Features walkthrough video',
    description: 'Video in the "Everything inside the kit" section. Optional — leave empty to show a placeholder.',
  },
  {
    key: 'installVideoUrl',
    label: 'Install walkthrough video',
    description: 'Video in the "How to install" section. Optional — leave empty to show a placeholder.',
  },
];

function isNonEmptyUrl(raw: string): boolean {
  return raw.trim().length > 0;
}

function isProbablyHttpUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function screenshotsToRaw(urls: string[]): string {
  return urls.join('\n');
}

function rawToScreenshots(raw: string): string[] {
  return raw
    .split('\n')
    .flatMap((s) => {
      const trimmed = s.trim();
      return trimmed ? [trimmed] : [];
    });
}

function ScreenshotThumb({ url }: { url: string }) {
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

function VideoPreview({ url }: { url: string }) {
  if (!isNonEmptyUrl(url)) {
    return (
      <div className={`${adminPreviewEmpty} min-h-32`}>
        <p className="text-[13px] text-muted">Enter or upload a video URL to preview it.</p>
      </div>
    );
  }

  if (!isProbablyHttpUrl(url)) {
    return (
      <div className={`${adminPreviewEmpty} min-h-32`}>
        <p className="text-[13px] text-muted">Preview needs an http(s) video URL.</p>
      </div>
    );
  }

  return (
    <div className={adminPreviewFrame}>
      <video
        className="aspect-video h-full w-full object-cover outline outline-1 outline-black/10 dark:outline-white/10"
        controls
        preload="metadata"
        playsInline
        src={url}
      />
    </div>
  );
}

export function AdminUiKitSettings() {
  const [screenshotsRaw, setScreenshotsRaw] = useState(
    () => screenshotsToRaw(DEFAULT_UI_KIT_SETTINGS.screenshots),
  );
  const [previewVideoUrl, setPreviewVideoUrl] = useState(DEFAULT_UI_KIT_SETTINGS.previewVideoUrl);
  const [featuresVideoUrl, setFeaturesVideoUrl] = useState(DEFAULT_UI_KIT_SETTINGS.featuresVideoUrl);
  const [installVideoUrl, setInstallVideoUrl] = useState(DEFAULT_UI_KIT_SETTINGS.installVideoUrl);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screenshotUploadError, setScreenshotUploadError] = useState<string | null>(null);
  const [videoUploadErrors, setVideoUploadErrors] = useState<Partial<Record<VideoFieldKey, string>>>({});

  const screenshotUrls = useMemo(() => rawToScreenshots(screenshotsRaw), [screenshotsRaw]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await adminFetch('/api/admin/ui-kit-settings');
        if (!cancelled) {
          if (res.ok) {
            const settings = (await res.json()) as UiKitSettings;
            setScreenshotsRaw(screenshotsToRaw(settings.screenshots));
            setPreviewVideoUrl(settings.previewVideoUrl);
            setFeaturesVideoUrl(settings.featuresVideoUrl);
            setInstallVideoUrl(settings.installVideoUrl);
          } else {
            const msg = await readAdminError(res);
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

  function setVideo(key: VideoFieldKey, value: string) {
    if (key === 'previewVideoUrl') setPreviewVideoUrl(value);
    else if (key === 'featuresVideoUrl') setFeaturesVideoUrl(value);
    else setInstallVideoUrl(value);
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);

    const payload: UiKitSettings = {
      screenshots: rawToScreenshots(screenshotsRaw),
      previewVideoUrl: previewVideoUrl.trim(),
      featuresVideoUrl: featuresVideoUrl.trim(),
      installVideoUrl: installVideoUrl.trim(),
    };

    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/ui-kit-settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await readAdminError(res);
        throw new Error(msg);
      }
      const settings = (await res.json()) as UiKitSettings;
      setScreenshotsRaw(screenshotsToRaw(settings.screenshots));
      setPreviewVideoUrl(settings.previewVideoUrl);
      setFeaturesVideoUrl(settings.featuresVideoUrl);
      setInstallVideoUrl(settings.installVideoUrl);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton skeleton-shimmer h-4 w-40 rounded-lg" />
        <div className="skeleton skeleton-shimmer h-10 w-full rounded-lg" />
        <div className="skeleton skeleton-shimmer h-4 w-32 rounded-lg" />
        <div className="skeleton skeleton-shimmer h-10 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="UI Kit media"
        description="Manage the /ui page screenshot gallery and walkthrough videos. Uploads use the same CMS token as project images. Screenshots can be http(s) URLs or root-relative paths (/ui-kit/*.webp); video URLs must be http(s)."
      />

      {loadError && (
        <div className={adminAlertWarning}>
          {loadError}. Showing defaults until the API can be reached.
        </div>
      )}

      {saveError && <div className={adminAlertError}>{saveError}</div>}

      {saved && (
        <div className={adminAlertSuccess}>
          UI Kit media saved. Refresh /ui to verify the new screenshots and videos.
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <section className={adminSectionCard}>
          <div className="space-y-3">
            <div>
              <label htmlFor="screenshotsRaw" className={adminLabelClass}>
                Screenshot URLs (one per line)
              </label>
              <textarea
                id="screenshotsRaw"
                name="screenshotsRaw"
                aria-label="Screenshot URLs (one per line)"
                rows={6}
                value={screenshotsRaw}
                onChange={(e) => {
                  setScreenshotsRaw(e.target.value);
                  setSaved(false);
                }}
                className={adminInputClass}
                placeholder="https://...png&#10;https://...webp"
              />
              <p className="mt-2 text-[13px] text-muted">
                At least 1, up to 12. Or drop multiple images below to append their URLs (duplicates skipped).
              </p>
            </div>

            <ProjectImageDropzone
              endpoint="uiKitScreenshot"
              headers={cmsUploadThingHeaders}
              aria-label="Upload screenshots"
              onClientUploadComplete={(res) => {
                const urls = res.flatMap((r) => (typeof r.url === 'string' ? [r.url] : []));
                setScreenshotsRaw((prev) => {
                  const existing = rawToScreenshots(prev);
                  const seen = new Set(existing);
                  for (const u of urls) {
                    seen.add(u);
                  }
                  return Array.from(seen).join('\n');
                });
                setScreenshotUploadError(null);
                setSaved(false);
              }}
              onUploadError={(err) => setScreenshotUploadError(err.message)}
              className={adminDropzoneClass}
            />
            {screenshotUploadError && <p className={adminTextError}>{screenshotUploadError}</p>}

            {screenshotUrls.length > 0 ? (
              <div className="pt-2">
                <p className={`${adminLabelClass} text-muted`}>Preview ({screenshotUrls.length})</p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {screenshotUrls.map((u) => (
                    <li key={u} className="min-w-0">
                      <ScreenshotThumb url={u} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        {videoFields.map((field) => (
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
                    value={(() => {
                      if (field.key === 'previewVideoUrl') return previewVideoUrl;
                      if (field.key === 'featuresVideoUrl') return featuresVideoUrl;
                      return installVideoUrl;
                    })()}
                    onChange={(event) => setVideo(field.key, event.target.value)}
                    className={adminInputClass}
                    placeholder="https://...mp4"
                  />
                  <p className="mt-2 text-[13px] text-muted">{field.description}</p>
                </div>

                <ProjectImageDropzone
                  endpoint="uiKitVideo"
                  headers={cmsUploadThingHeaders}
                  aria-label={`Upload ${field.label}`}
                  onClientUploadComplete={(res) => {
                    const url = res[0]?.url;
                    if (typeof url === 'string') {
                      setVideo(field.key, url);
                    }
                    setVideoUploadErrors((current) => ({ ...current, [field.key]: undefined }));
                  }}
                  onUploadError={(err) => {
                    setVideoUploadErrors((current) => ({ ...current, [field.key]: err.message }));
                  }}
                  className={adminDropzoneClass}
                />
                {videoUploadErrors[field.key] && (
                  <p className={adminTextError}>{videoUploadErrors[field.key]}</p>
                )}
              </div>

              <div>
                <p className={`${adminLabelClass} text-muted`}>Preview</p>
                <VideoPreview
                  key={field.key}
                  url={
                    field.key === 'previewVideoUrl'
                      ? previewVideoUrl
                      : field.key === 'featuresVideoUrl'
                        ? featuresVideoUrl
                        : installVideoUrl
                  }
                />
              </div>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className={adminBtnPrimary}>
            {saving ? 'Saving…' : 'Save UI Kit media'}
          </button>
        </div>
      </form>
    </div>
  );
}
