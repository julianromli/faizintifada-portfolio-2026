import { adminFetch, readAdminError } from './admin-api';
import type { CoachingTestimonial } from '../types/coaching-testimonial';

export async function fetchCoachingTestimonials(): Promise<CoachingTestimonial[]> {
  const res = await adminFetch('/api/admin/coaching-testimonials');
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
  return (await res.json()) as CoachingTestimonial[];
}

export async function deleteCoachingTestimonial(id: number): Promise<void> {
  const res = await adminFetch(`/api/admin/coaching-testimonials/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
}
