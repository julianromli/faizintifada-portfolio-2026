export const SOUND_STORAGE_KEY = 'faiz-sound';

export const DEFAULT_SOUND_VOLUME = 0.3;

export type SoundPrefs = {
  enabled: boolean;
  volume: number;
};

export const DEFAULT_SOUND_PREFS: SoundPrefs = {
  enabled: true,
  volume: DEFAULT_SOUND_VOLUME,
};

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SOUND_VOLUME;
  return Math.min(1, Math.max(0, value));
}

export function getStoredSoundPrefs(): SoundPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_SOUND_PREFS };

  try {
    const raw = localStorage.getItem(SOUND_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SOUND_PREFS };

    const parsed = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      enabled: parsed.enabled !== false,
      volume: parsed.volume === undefined ? DEFAULT_SOUND_VOLUME : clampVolume(parsed.volume),
    };
  } catch {
    return { ...DEFAULT_SOUND_PREFS };
  }
}

export function persistSoundPrefs(prefs: SoundPrefs): void {
  localStorage.setItem(
    SOUND_STORAGE_KEY,
    JSON.stringify({
      enabled: prefs.enabled,
      volume: clampVolume(prefs.volume),
    }),
  );
}
