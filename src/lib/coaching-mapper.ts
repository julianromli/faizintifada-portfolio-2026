import type {
  CoachingSubmissionRow,
  NewCoachingSubmissionRow,
} from '../db/schema.js';
import type {
  CoachingExperience,
  CoachingIde,
  CoachingOs,
  CoachingSubmission,
} from '../types/coaching.js';

export function rowToCoachingSubmission(row: CoachingSubmissionRow): CoachingSubmission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contact: row.contact ?? undefined,
    os: row.os as CoachingOs,
    ide: row.ide as CoachingIde,
    ideOther: row.ideOther ?? undefined,
    experience: row.experience as CoachingExperience,
    about: row.about,
    goal: row.goal,
    repoUrl: row.repoUrl ?? undefined,
    agreedToTerms: row.agreedToTerms,
    createdAt: row.createdAt,
  };
}

export function coachingPayloadToInsertValues(data: {
  name: string;
  email: string;
  contact?: string;
  os: CoachingOs;
  ide: CoachingIde;
  ideOther?: string;
  experience: CoachingExperience;
  about: string;
  goal: string;
  repoUrl?: string;
  agreedToTerms: true;
}): Omit<NewCoachingSubmissionRow, 'id'> {
  return {
    name: data.name,
    email: data.email,
    contact: data.contact ?? null,
    os: data.os,
    ide: data.ide,
    ideOther: data.ide === 'other' ? data.ideOther ?? null : null,
    experience: data.experience,
    about: data.about,
    goal: data.goal,
    repoUrl: data.repoUrl ?? null,
    agreedToTerms: data.agreedToTerms,
    createdAt: Date.now(),
  };
}
