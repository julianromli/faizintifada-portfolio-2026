export type CoachingOs = 'mac' | 'windows' | 'linux';
export type CoachingIde = 'cursor' | 'vscode' | 'windsurf' | 'other';
export type CoachingExperience = 'beginner' | 'experienced' | 'optimize';

export interface CoachingSubmission {
  id: number;
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
  agreedToTerms: boolean;
  createdAt: number;
}

/** Public form payload (no id/createdAt; honeypot is sent separately and never stored). */
export interface CoachingSubmissionInput {
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
  agreedToTerms: boolean;
}
