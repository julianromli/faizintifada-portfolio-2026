export type SoundKind = 'click' | 'success' | 'error';

export type SoundPitch = 'default' | 'low';

export type PlaySoundOptions = {
  volume: number;
  pitch?: SoundPitch;
};

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/** Unlock the shared context on the first gesture so later plays have no delay. */
export function installAudioUnlock(): () => void {
  if (typeof document === 'undefined') return () => {};

  const unlock = () => {
    void resumeAudioContext();
  };

  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });

  return () => {
    document.removeEventListener('pointerdown', unlock, { capture: true });
    document.removeEventListener('keydown', unlock, { capture: true });
  };
}

function peakGain(volume: number, voiceGain: number): number {
  return Math.min(volume * voiceGain, 0.99);
}

function cleanupNodes(nodes: AudioNode[]): void {
  for (const node of nodes) {
    node.disconnect();
  }
}

function playClick(ctx: AudioContext, volume: number): void {
  const duration = 0.008;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 50);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4000;
  filter.Q.value = 3;

  const gain = ctx.createGain();
  const peak = peakGain(volume, 0.35);
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  const nodes = [source, filter, gain];
  source.onended = () => cleanupNodes(nodes);
  source.start(t);
  source.stop(t + duration);
}

function playTone(
  ctx: AudioContext,
  volume: number,
  {
    startHz,
    endHz,
    duration,
    sweep,
    voiceGain,
  }: {
    startHz: number;
    endHz: number;
    duration: number;
    sweep: number;
    voiceGain: number;
  },
): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startHz, t);
  osc.frequency.exponentialRampToValueAtTime(endHz, t + sweep);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peakGain(volume, voiceGain), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  const nodes = [osc, gain];
  osc.onended = () => cleanupNodes(nodes);
  osc.start(t);
  osc.stop(t + duration);
}

function synthesize(ctx: AudioContext, kind: SoundKind, options: PlaySoundOptions): void {
  const volume = options.volume;

  if (kind === 'click') {
    playClick(ctx, volume);
    return;
  }

  if (kind === 'success') {
    const low = options.pitch === 'low';
    playTone(ctx, volume, {
      startHz: low ? 392 : 523,
      endHz: low ? 523 : 784,
      duration: 0.15,
      sweep: 0.04,
      voiceGain: 0.28,
    });
    return;
  }

  playTone(ctx, volume, {
    startHz: 400,
    endHz: 280,
    duration: 0.12,
    sweep: 0.08,
    voiceGain: 0.2,
  });
}

export function playSynthesizedSound(kind: SoundKind, options: PlaySoundOptions): void {
  if (typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;
  if (options.volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().then(() => {
      if (ctx.state === 'running') {
        synthesize(ctx, kind, options);
      }
    });
    return;
  }

  synthesize(ctx, kind, options);
}
