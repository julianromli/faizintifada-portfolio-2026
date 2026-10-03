import type { ReactNode } from 'react';

type IconSwapProps = {
  state: 'a' | 'b';
  iconA: ReactNode;
  iconB: ReactNode;
};

export function IconSwap({ state, iconA, iconB }: IconSwapProps) {
  return (
    <span className="t-icon-swap" data-state={state}>
      <span className="t-icon" data-icon="a" aria-hidden="true">
        {iconA}
      </span>
      <span className="t-icon" data-icon="b" aria-hidden="true">
        {iconB}
      </span>
    </span>
  );
}
