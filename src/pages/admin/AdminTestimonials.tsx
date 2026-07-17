import { useEffect, useRef, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { adminFetch, readAdminError } from '../../lib/admin-api';
import { adminAlertWarning } from '../../lib/admin-styles';
import type { Testimonial } from '../../types/testimonial';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  AdminTestimonialsSection,
  type AdminTestimonialsSectionHandle,
} from './AdminTestimonialsSection';

export function AdminTestimonials() {
  const sectionRef = useRef<AdminTestimonialsSectionHandle>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await adminFetch('/api/admin/testimonials');
        if (!res.ok) {
          const msg = await readAdminError(res);
          throw new Error(msg);
        }
        const items = (await res.json()) as Testimonial[];
        if (!cancelled) {
          setTestimonials(items);
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
      <AdminPageHeader
        title="Testimonials"
        description="Carousel quotes on the homepage hero. Lower sort order appears first."
        action={{
          type: 'button',
          label: 'Add testimonial',
          icon: <Plus size={18} weight="bold" aria-hidden />,
          onClick: () => sectionRef.current?.startNew(),
        }}
      />

      {loadError ? (
        <div className={`${adminAlertWarning} mb-6`}>
          {loadError}. Showing an empty list until the API can be reached.
        </div>
      ) : null}

      <AdminTestimonialsSection
        ref={sectionRef}
        testimonials={testimonials}
        onChange={setTestimonials}
        hideHeader
      />
    </div>
  );
}
