import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { Microphone, PencilSimple, Plus, Trash, VideoCamera } from '@phosphor-icons/react';
import { adminFetch, cmsUploadThingHeaders, readAdminError } from '../../lib/admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminAlertWarning,
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
import type { SpeakingEvent, SpeakingEventType } from '../../types/speaking-event';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ProjectImageDropzone } from '../../uploadthing/client';
import { Select } from '../../components/Select';

type FormState = {
  image: string;
  title: string;
  eventType: SpeakingEventType;
  organizer: string;
  location: string;
  eventDate: string;
  audienceCount: string;
  link: string;
  featured: boolean;
  sortOrder: string;
};

function emptyForm(): FormState {
  return {
    image: '',
    title: '',
    eventType: 'offline',
    organizer: '',
    location: '',
    eventDate: '',
    audienceCount: '',
    link: '',
    featured: true,
    sortOrder: '0',
  };
}

function eventToForm(e: SpeakingEvent): FormState {
  return {
    image: e.image,
    title: e.title,
    eventType: e.eventType,
    organizer: e.organizer ?? '',
    location: e.location ?? '',
    eventDate: e.eventDate ?? '',
    audienceCount: e.audienceCount != null ? String(e.audienceCount) : '',
    link: e.link ?? '',
    featured: e.featured,
    sortOrder: String(e.sortOrder),
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

function ImagePreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);

  if (!isProbablyHttpImageUrl(url)) {
    return (
      <div className={`${adminPreviewEmpty} size-24 px-2`}>
        <p className="text-[12px] text-muted">Upload or paste URL</p>
      </div>
    );
  }

  if (broken) {
    return (
      <div className={`${adminPreviewEmpty} size-24 px-2`}>
        <p className="text-[12px] text-muted">Preview unavailable</p>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`size-24 bg-surface object-cover ${adminImageThumb} rounded-xl`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

type EditingState = { mode: 'new' } | { mode: 'edit'; id: number };

export function AdminSpeakingEvents() {
  const [events, setEvents] = useState<SpeakingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await adminFetch('/api/admin/speaking-events');
        if (!res.ok) {
          throw new Error(await readAdminError(res));
        }
        const items = (await res.json()) as SpeakingEvent[];
        if (!cancelled) setEvents(items);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...events].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccessMessage(null);
  }

  function startNew() {
    setEditing({ mode: 'new' });
    setForm(emptyForm());
    setSaveError(null);
    setSuccessMessage(null);
    setImageUploadError(null);
  }

  function startEdit(e: SpeakingEvent) {
    setEditing({ mode: 'edit', id: e.id });
    setForm(eventToForm(e));
    setSaveError(null);
    setSuccessMessage(null);
    setImageUploadError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm());
    setSaveError(null);
    setImageUploadError(null);
  }

  async function reloadList() {
    const res = await adminFetch('/api/admin/speaking-events');
    if (!res.ok) {
      throw new Error(await readAdminError(res));
    }
    const items = (await res.json()) as SpeakingEvent[];
    setEvents(items);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    let sortNum = Number.parseInt(form.sortOrder, 10);
    if (Number.isNaN(sortNum) || sortNum < 0) sortNum = 0;

    let audienceNum: number | undefined;
    const audienceRaw = form.audienceCount.trim();
    if (audienceRaw) {
      const parsed = Number.parseInt(audienceRaw, 10);
      audienceNum = Number.isNaN(parsed) || parsed < 0 ? undefined : parsed;
    }

    const payload = {
      image: form.image.trim(),
      title: form.title.trim(),
      eventType: form.eventType,
      organizer: form.organizer.trim() || undefined,
      location: form.location.trim() || undefined,
      eventDate: form.eventDate.trim() || undefined,
      audienceCount: audienceNum,
      link: form.link.trim() || undefined,
      featured: form.featured,
      sortOrder: sortNum,
    };

    if (!payload.image || !payload.title) {
      setSaveError('Image and title are required.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = editing?.mode === 'edit';
      const res = await adminFetch(
        isEdit ? `/api/admin/speaking-events/${editing.id}` : '/api/admin/speaking-events',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        throw new Error(await readAdminError(res));
      }
      await reloadList();
      setSuccessMessage(isEdit ? 'Event updated.' : 'Event created.');
      setEditing(null);
      setForm(emptyForm());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(id: number, title: string) {
    setSaveError(null);
    setSuccessMessage(null);
    setPendingDelete({ id, title });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/speaking-events/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(await readAdminError(res));
      }
      setEvents((items) => items.filter((e) => e.id !== id));
      if (editing?.mode === 'edit' && editing.id === id) cancelEdit();
      setSuccessMessage('Event deleted.');
      setPendingDelete(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2.5">
        <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
        <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
        <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
        <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete event?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium text-foreground">{pendingDelete.title}</span>
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

      <AdminPageHeader
        title="Speaking & Events"
        description="AI speaking gallery on the homepage. Lower sort order appears first; the first featured item shows as the large tile."
        action={{
          type: 'button',
          label: 'Add event',
          icon: <Plus size={18} weight="bold" aria-hidden />,
          onClick: startNew,
        }}
      />

      {loadError ? (
        <div className={`${adminAlertWarning} mb-6`}>
          {loadError}. Showing an empty list until the API can be reached.
        </div>
      ) : null}

      {saveError && <div className={`${adminAlertError} mb-6`}>{saveError}</div>}
      {successMessage && <div className={`${adminAlertSuccess} mb-6`}>{successMessage}</div>}

      {editing && (
        <form onSubmit={(e) => void handleSubmit(e)} className={`space-y-4 mb-8 ${adminSectionCard}`}>
          <h3 className="text-[15px] font-semibold text-foreground">
            {editing.mode === 'new' ? 'New event' : 'Edit event'}
          </h3>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-3">
              <div>
                <label htmlFor="event-image" className={adminLabelClass}>
                  Photo
                </label>
                <input
                  id="event-image"
                  name="image"
                  required
                  value={form.image}
                  onChange={(e) => update('image', e.target.value)}
                  className={adminInputClass}
                  placeholder="https://..."
                />
              </div>
              <ProjectImageDropzone
                endpoint="pageImage"
                headers={cmsUploadThingHeaders}
                aria-label="Upload event photo"
                onClientUploadComplete={(res) => {
                  const url = res[0]?.url;
                  if (typeof url === 'string') update('image', url);
                  setImageUploadError(null);
                }}
                onUploadError={(err) => setImageUploadError(err.message)}
                className={adminDropzoneClass}
              />
              {imageUploadError && <p className={adminTextError}>{imageUploadError}</p>}
            </div>
            <ImagePreview url={form.image} />
          </div>

          <div>
            <label htmlFor="event-title" className={adminLabelClass}>
              Title / topic
            </label>
            <input
              id="event-title"
              name="title"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={adminInputClass}
              placeholder="Building with AI: A Hands-on Workshop"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-type" className={adminLabelClass}>
                Type
              </label>
              <Select
                id="event-type"
                name="eventType"
                aria-label="Event type"
                value={form.eventType}
                onChange={(v) => update('eventType', v as SpeakingEventType)}
                options={[
                  { value: 'offline', label: 'Offline event', icon: <Microphone size={15} weight="fill" /> },
                  { value: 'webinar', label: 'Webinar / online', icon: <VideoCamera size={15} weight="fill" /> },
                ]}
              />
            </div>
            <div>
              <label htmlFor="event-date" className={adminLabelClass}>
                Date <span className="text-muted">(free text)</span>
              </label>
              <input
                id="event-date"
                name="eventDate"
                value={form.eventDate}
                onChange={(e) => update('eventDate', e.target.value)}
                className={adminInputClass}
                placeholder="Mar 2025"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-organizer" className={adminLabelClass}>
                Organizer
              </label>
              <input
                id="event-organizer"
                name="organizer"
                value={form.organizer}
                onChange={(e) => update('organizer', e.target.value)}
                className={adminInputClass}
                placeholder="Google Developer Group"
              />
            </div>
            <div>
              <label htmlFor="event-location" className={adminLabelClass}>
                Location
              </label>
              <input
                id="event-location"
                name="location"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className={adminInputClass}
                placeholder="Jakarta / Online"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-audience" className={adminLabelClass}>
                Audience count <span className="text-muted">(optional)</span>
              </label>
              <input
                id="event-audience"
                name="audienceCount"
                type="number"
                min={0}
                value={form.audienceCount}
                onChange={(e) => update('audienceCount', e.target.value)}
                className={adminInputClass}
                placeholder="150"
              />
            </div>
            <div>
              <label htmlFor="event-link" className={adminLabelClass}>
                Link <span className="text-muted">(optional)</span>
              </label>
              <input
                id="event-link"
                name="link"
                value={form.link}
                onChange={(e) => update('link', e.target.value)}
                className={adminInputClass}
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-sortOrder" className={adminLabelClass}>
                Sort order
              </label>
              <input
                id="event-sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => update('sortOrder', e.target.value)}
                className={adminInputClass}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 text-[14px] font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update('featured', e.target.checked)}
                  className="size-4 rounded border-border"
                />
                Show on homepage
              </label>
            </div>
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
        <p className="text-[15px] text-muted">No events yet. Add one to show the Speaking &amp; Events section.</p>
      ) : (
        <m.ul className="space-y-3" initial="hidden" animate="show" variants={staggerContainer}>
          {sorted.map((e) => (
            <m.li key={e.id} className={`flex flex-wrap items-center gap-4 ${adminListItem}`} variants={staggerItem}>
              <img src={e.image} alt="" className={`size-14 shrink-0 ${adminImageThumb} rounded-xl`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
                    <span className="relative inline-flex size-[11px] items-center justify-center">
                      <AnimatePresence mode="wait" initial={false}>
                        {e.eventType === 'webinar' ? (
                          <m.span
                            key="webinar"
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                          >
                            <VideoCamera size={11} weight="fill" />
                          </m.span>
                        ) : (
                          <m.span
                            key="offline"
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                          >
                            <Microphone size={11} weight="fill" />
                          </m.span>
                        )}
                      </AnimatePresence>
                    </span>
                    {e.eventType === 'webinar' ? 'Webinar' : 'Offline'}
                  </span>
                  {!e.featured && (
                    <span className="text-[11px] font-medium text-muted/70">Hidden</span>
                  )}
                </div>
                <p className="mt-1 truncate text-[15px] font-medium text-foreground">{e.title}</p>
                <p className="truncate text-[13px] text-muted">
                  {[e.organizer, e.location, e.eventDate].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 tabular-nums text-[12px] text-muted/70">
                  Sort: {e.sortOrder}
                  {e.audienceCount ? ` · ${e.audienceCount} audience` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => startEdit(e)} className={adminBtnSecondaryXs}>
                  <PencilSimple size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(e.id, e.title)}
                  className={adminBtnDestructiveOutline}
                >
                  <Trash size={16} />
                  Delete
                </button>
              </div>
            </m.li>
          ))}
        </m.ul>
      )}
    </div>
  );
}
