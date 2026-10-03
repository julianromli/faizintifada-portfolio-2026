import { useEffect, useRef } from 'react';

type FormErrorProps = {
  message: string | null;
  id?: string;
  className?: string;
};

export function FormError({ message, id, className }: FormErrorProps) {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !message) return;

    input.classList.remove('is-shaking');
    void input.offsetWidth;
    input.classList.add('is-shaking');

    const cs = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: number) => {
      const value = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const shakeMs = read('--shake-dur-a', 80) * 2 + read('--shake-dur-b', 60) * 2;
    const timer = window.setTimeout(() => input.classList.remove('is-shaking'), shakeMs + 20);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const tone = className ?? 'alert alert-error';

  return (
    <div className="t-input-wrap is-error">
      <div ref={inputRef} id={id} role="alert" className={`t-input is-error ${tone}`}>
        {message}
      </div>
    </div>
  );
}
