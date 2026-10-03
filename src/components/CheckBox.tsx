import { useId, type ReactNode } from 'react';

type CheckBoxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
};

export function CheckBox({ checked, onChange, children }: CheckBoxProps) {
  const labelId = useId();

  return (
    <div className="flex items-start gap-3 text-[14px] text-foreground">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className="t-check mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border bg-transparent p-0.5 text-canvas aria-checked:border-foreground aria-checked:bg-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <svg viewBox="0 0 10.1668 10.1668" className="size-full" fill="none" aria-hidden="true">
          <path
            d="M1 5.52L3.92 9.17L9.17 1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span
        id={labelId}
        className="cursor-pointer"
        onClick={() => onChange(!checked)}
      >
        {children}
      </span>
    </div>
  );
}
