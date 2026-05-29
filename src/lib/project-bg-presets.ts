export const PROJECT_BG_PRESET_KEYS = [
  'bg-surface-blue',
  'bg-surface-warm',
  'bg-surface-purple',
  'bg-surface-neutral',
] as const;

export type ProjectBgPresetKey = (typeof PROJECT_BG_PRESET_KEYS)[number];

export const PROJECT_BG_PRESETS: Record<
  ProjectBgPresetKey,
  { label: string; classes: string }
> = {
  'bg-surface-blue': {
    label: 'Blue tint',
    classes: 'bg-blue-50 dark:bg-blue-950/40',
  },
  'bg-surface-warm': {
    label: 'Warm ivory',
    classes: 'bg-[#f4f2ef] dark:bg-stone-900/50',
  },
  'bg-surface-purple': {
    label: 'Purple tint',
    classes: 'bg-purple-50 dark:bg-purple-950/40',
  },
  'bg-surface-neutral': {
    label: 'Neutral (canvas)',
    classes: 'bg-canvas',
  },
};

/** Legacy free-form Tailwind values from before preset migration. */
export const LEGACY_BG_CLASS_MAP: Record<string, ProjectBgPresetKey> = {
  'bg-blue-50': 'bg-surface-blue',
  'bg-[#f4f2ef]': 'bg-surface-warm',
  'bg-purple-50': 'bg-surface-purple',
  'bg-gray-50': 'bg-surface-neutral',
};

export function isProjectBgPresetKey(value: string): value is ProjectBgPresetKey {
  return (PROJECT_BG_PRESET_KEYS as readonly string[]).includes(value);
}

export function normalizeBgClassPreset(value: string): ProjectBgPresetKey {
  const trimmed = value.trim();
  if (isProjectBgPresetKey(trimmed)) {
    return trimmed;
  }
  const legacy = LEGACY_BG_CLASS_MAP[trimmed];
  if (legacy) {
    return legacy;
  }
  return 'bg-surface-neutral';
}

export function resolveProjectBgClass(value: string): string {
  return PROJECT_BG_PRESETS[normalizeBgClassPreset(value)].classes;
}
