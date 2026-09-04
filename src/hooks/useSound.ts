import { createContext, useContext } from 'react';
import type { SoundKind, SoundPitch } from '../lib/audio-engine';

export type PlaySound = (kind: SoundKind, options?: { pitch?: SoundPitch }) => void;

export interface SoundContextValue {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  playSound: PlaySound;
}

export const SoundContext = createContext<SoundContextValue | null>(null);

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return ctx;
}
