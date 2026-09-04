import { playSynthesizedSound } from './audio-engine';
import type { SoundPrefs } from './sound';

const BUTTON_SELECTOR = 'button, input[type="button"], input[type="submit"], input[type="reset"]';

let outcomeThisTurn = false;

/** Call when a confirmation or error sound plays so the same press does not also click. */
export function markSoundOutcome(): void {
  outcomeThisTurn = true;
}

function consumeSoundOutcome(): boolean {
  const played = outcomeThisTurn;
  outcomeThisTurn = false;
  return played;
}

function isSilentButton(control: HTMLElement): boolean {
  if (control.getAttribute('aria-hidden') === 'true') return true;
  if (control.getAttribute('aria-disabled') === 'true') return true;
  if (control.dataset.sound === 'none') return true;
  if (control instanceof HTMLButtonElement && control.disabled) return true;
  if (control instanceof HTMLInputElement && control.disabled) return true;
  return false;
}

/** Play the click voice on pointer-activated buttons. Keyboard activation stays silent. */
export function installButtonClickSound(getPrefs: () => SoundPrefs): () => void {
  if (typeof document === 'undefined') return () => {};

  function onClick(event: MouseEvent) {
    if (event.detail === 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const control = target.closest(BUTTON_SELECTOR);
    if (!(control instanceof HTMLElement) || isSilentButton(control)) return;

    const { enabled, volume } = getPrefs();
    if (!enabled || volume <= 0) return;

    queueMicrotask(() => {
      if (consumeSoundOutcome()) return;
      playSynthesizedSound('click', { volume });
    });
  }

  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
