import type {
  CoachingExperience,
  CoachingIde,
  CoachingOs,
} from '../types/coaching';

/** Hidden honeypot field name — bots tend to fill it, humans never see it. */
export const COACHING_HONEYPOT_FIELD = 'company';

export const COACHING_OS_OPTIONS: ReadonlyArray<{ value: CoachingOs; label: string }> = [
  { value: 'mac', label: 'Mac' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
];

export const COACHING_IDE_OPTIONS: ReadonlyArray<{ value: CoachingIde; label: string }> = [
  { value: 'cursor', label: 'Cursor' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'other', label: 'Lainnya' },
];

export const COACHING_EXPERIENCE_OPTIONS: ReadonlyArray<{
  value: CoachingExperience;
  label: string;
}> = [
  { value: 'beginner', label: 'Baru mulai' },
  { value: 'experienced', label: 'Udah sering vibe coding' },
  { value: 'optimize', label: 'Mau optimasi workflow' },
];

export function coachingOsLabel(value: string): string {
  return COACHING_OS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function coachingIdeLabel(value: string): string {
  return COACHING_IDE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function coachingExperienceLabel(value: string): string {
  return COACHING_EXPERIENCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
