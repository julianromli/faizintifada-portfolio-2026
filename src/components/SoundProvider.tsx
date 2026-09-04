import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SoundContext, type PlaySound } from '../hooks/useSound';
import { installAudioUnlock, playSynthesizedSound } from '../lib/audio-engine';
import { installButtonClickSound, markSoundOutcome } from '../lib/button-click-sound';
import {
  clampVolume,
  getStoredSoundPrefs,
  persistSoundPrefs,
  type SoundPrefs,
} from '../lib/sound';

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [prefs, setPrefs] = useState<SoundPrefs>(() => getStoredSoundPrefs());
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    persistSoundPrefs(prefs);
  }, [prefs]);

  useEffect(() => installAudioUnlock(), []);

  useEffect(() => installButtonClickSound(() => prefsRef.current), []);

  const setEnabled = useCallback((enabled: boolean) => {
    setPrefs((current) => {
      const next = { ...current, enabled };
      prefsRef.current = next;
      return next;
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPrefs((current) => {
      const next = { ...current, volume: clampVolume(volume) };
      prefsRef.current = next;
      return next;
    });
  }, []);

  const playSound = useCallback<PlaySound>((kind, options) => {
    const { enabled, volume } = prefsRef.current;
    if (!enabled || volume <= 0) return;
    if (kind !== 'click') markSoundOutcome();
    playSynthesizedSound(kind, { volume, pitch: options?.pitch });
  }, []);

  const value = useMemo(
    () => ({
      enabled: prefs.enabled,
      volume: prefs.volume,
      setEnabled,
      setVolume,
      playSound,
    }),
    [prefs.enabled, prefs.volume, setEnabled, setVolume, playSound],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}
