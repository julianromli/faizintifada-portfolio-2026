import { adminFetch, readAdminError } from './admin-api';
import type { CoachingSubmission } from '../types/coaching';

export async function fetchCoachingSubmissions(): Promise<CoachingSubmission[]> {
  const res = await adminFetch('/api/admin/coaching');
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
  return (await res.json()) as CoachingSubmission[];
}

export async function deleteCoachingSubmission(id: number): Promise<void> {
  const res = await adminFetch(`/api/admin/coaching/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await readAdminError(res));
  }
}
